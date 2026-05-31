import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getStripe } from "./stripe.server";
import { MIN_PRODUCT_PRICE_CENTS } from "./plans";

function getOrigin() {
  return process.env.PUBLIC_APP_URL || "http://localhost:8080";
}

export const createProCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_PRO_PRICE_ID missing");

    const { userId, claims } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    const email = typeof claims.email === "string" ? claims.email : undefined;

    // Skip stripe.customers.list (slow extra round-trip). If we don't have a
    // stored customer_id, pass customer_email and let Stripe handle it; the
    // webhook will persist the resulting customer_id back to the profile.
    const customerId = profile?.stripe_customer_id ?? undefined;

    const origin = getOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgrade=success`,
      cancel_url: `${origin}/pricing?upgrade=cancel`,
      client_reference_id: userId,
      metadata: { user_id: userId, kind: "pro_subscription" },
      subscription_data: { metadata: { user_id: userId } },
      allow_promotion_codes: true,
    });

    return { url: session.url };
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
    const { userId } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new Error("Aucun abonnement actif trouvé.");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getOrigin()}/dashboard`,
    });
    return { url: session.url };
  });

export const createProductCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      productId: z.string().uuid(),
      email: z.string().email(),
      acceptedRetraction: z.literal(true),
    }).parse,
  )
  .handler(async ({ data }) => {
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("id, user_id, title, description, price_cents, image_url")
      .eq("id", data.productId)
      .single();

    if (error || !product) throw new Error("Produit introuvable");
    if (product.price_cents < MIN_PRODUCT_PRICE_CENTS) {
      throw new Error("Prix minimum 5$");
    }

    const origin = getOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: product.price_cents,
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.image_url ? [product.image_url] : undefined,
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: {
          product_id: product.id,
          seller_id: product.user_id,
          buyer_email: data.email,
          kind: "product_purchase",
        },
      },
      metadata: {
        product_id: product.id,
        seller_id: product.user_id,
        buyer_email: data.email,
        kind: "product_purchase",
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    return { url: session.url };
  });
