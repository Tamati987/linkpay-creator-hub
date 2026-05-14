import { createFileRoute } from "@tanstack/react-router";
import { getStripe } from "@/lib/stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type Stripe from "stripe";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret missing", { status: 500 });

        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("No signature", { status: 400 });

        const body = await request.text();
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, secret);
        } catch (err) {
          console.error("Webhook signature failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const s = event.data.object as Stripe.Checkout.Session;
              const userId = s.client_reference_id || s.metadata?.user_id;
              if (s.mode === "subscription" && userId) {
                await supabaseAdmin
                  .from("profiles")
                  .update({
                    is_pro: true,
                    stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer?.id,
                    stripe_subscription_id:
                      typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null,
                  })
                  .eq("id", userId);
              }
              break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.created": {
              const sub = event.data.object as Stripe.Subscription;
              const userId = sub.metadata?.user_id;
              const active = ["active", "trialing"].includes(sub.status);
              if (userId) {
                await supabaseAdmin
                  .from("profiles")
                  .update({
                    is_pro: active,
                    stripe_subscription_id: sub.id,
                    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
                  })
                  .eq("id", userId);
              }
              break;
            }
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              const userId = sub.metadata?.user_id;
              if (userId) {
                await supabaseAdmin
                  .from("profiles")
                  .update({ is_pro: false, stripe_subscription_id: null })
                  .eq("id", userId);
              }
              break;
            }
            case "payment_intent.succeeded": {
              const pi = event.data.object as Stripe.PaymentIntent;
              const meta = pi.metadata || {};
              if (meta.kind === "product_purchase" && meta.seller_id) {
                await supabaseAdmin.from("sales_logs").insert({
                  seller_id: meta.seller_id,
                  product_id: meta.product_id || null,
                  type: "product",
                  buyer_email: meta.buyer_email || pi.receipt_email,
                  amount_cents: pi.amount_received,
                  currency: pi.currency,
                  stripe_payment_intent_id: pi.id,
                });
              }
              break;
            }
            case "invoice.payment_succeeded": {
              const inv = event.data.object as Stripe.Invoice;
              // @ts-ignore - subscription is on Invoice
              const subId: string | null = inv.subscription as any;
              if (subId) {
                const sub = await stripe.subscriptions.retrieve(subId);
                const userId = sub.metadata?.user_id;
                if (userId) {
                  await supabaseAdmin.from("sales_logs").insert({
                    seller_id: userId,
                    type: "subscription",
                    buyer_email: inv.customer_email,
                    amount_cents: inv.amount_paid,
                    currency: inv.currency,
                    stripe_subscription_id: subId,
                  });
                }
              }
              break;
            }
          }
        } catch (err) {
          console.error("Webhook handler error", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
