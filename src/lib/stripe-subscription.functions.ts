import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getStripe } from "./stripe.server";

export const checkSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
    const { userId } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_pro: false, stripe_subscription_id: null })
        .eq("id", userId);
      return { subscribed: false, subscription_end: null };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    const hasActive = subscriptions.data.length > 0;
    const sub = hasActive ? subscriptions.data[0] : null;

    await supabaseAdmin
      .from("profiles")
      .update({
        is_pro: hasActive,
        stripe_subscription_id: sub ? sub.id : null,
      })
      .eq("id", userId);

    return {
      subscribed: hasActive,
      subscription_end: sub
        ? new Date((sub as any).current_period_end * 1000).toISOString()
        : null,
    };
  });
