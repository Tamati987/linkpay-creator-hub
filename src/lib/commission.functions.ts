import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getStripe } from "./stripe.server";

function getOrigin() {
  return process.env.PUBLIC_APP_URL || "http://localhost:8080";
}

export const createCommissionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      declaredAmountCents: z.number().int().min(100).max(10_000_000),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_pro, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.is_pro) {
      throw new Error("Les vendeurs Pro n'ont pas de commission à verser.");
    }

    const commission = Math.max(50, Math.round(data.declaredAmountCents * 0.05));
    const email = typeof claims.email === "string" ? claims.email : undefined;
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");

    const { data: row, error } = await supabaseAdmin
      .from("commission_payments")
      .insert({
        user_id: userId,
        declared_amount_cents: data.declaredAmountCents,
        commission_cents: commission,
        currency: "eur",
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Impossible de créer le versement.");

    const origin = getOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: commission,
            product_data: {
              name: "Commission plateforme 5%",
              description: `Versement sur CA déclaré de ${(data.declaredAmountCents / 100).toFixed(2)} €`,
            },
          },
        },
      ],
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        kind: "commission_payment",
        commission_payment_id: row.id,
        declared_amount_cents: String(data.declaredAmountCents),
      },
      payment_intent_data: {
        metadata: {
          user_id: userId,
          kind: "commission_payment",
          commission_payment_id: row.id,
        },
      },
      success_url: `${origin}/dashboard?commission=success`,
      cancel_url: `${origin}/dashboard?commission=cancel`,
    });

    await supabaseAdmin
      .from("commission_payments")
      .update({ stripe_session_id: session.id })
      .eq("id", row.id);

    return { url: session.url };
  });

export const listCommissionPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("commission_payments")
      .select("id, declared_amount_cents, commission_cents, currency, status, created_at, paid_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return { payments: data ?? [] };
  });
