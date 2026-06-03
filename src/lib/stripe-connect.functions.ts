import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getStripe } from "./stripe.server";

function getOrigin() {
  return process.env.PUBLIC_APP_URL || "http://localhost:8080";
}

export const PLATFORM_FEE_BPS = 500; // 5%

async function ensureAccount(userId: string, email: string | undefined) {
  const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_connect_account_id) {
    return profile.stripe_connect_account_id;
  }

  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    metadata: { user_id: userId },
  });

  await supabaseAdmin
    .from("profiles")
    .update({ stripe_connect_account_id: account.id })
    .eq("id", userId);

  return account.id;
}

async function syncStatus(accountId: string, userId: string) {
  const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
  const acc = await stripe.accounts.retrieve(accountId);
  await supabaseAdmin
    .from("profiles")
    .update({
      stripe_connect_charges_enabled: !!acc.charges_enabled,
      stripe_connect_payouts_enabled: !!acc.payouts_enabled,
    })
    .eq("id", userId);
  return {
    charges_enabled: !!acc.charges_enabled,
    payouts_enabled: !!acc.payouts_enabled,
    details_submitted: !!acc.details_submitted,
  };
}

export const createConnectOnboardingLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
    const { userId, claims } = context;
    const email = typeof claims.email === "string" ? claims.email : undefined;
    const accountId = await ensureAccount(userId, email);
    const origin = getOrigin();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard?connect=refresh`,
      return_url: `${origin}/dashboard?connect=return`,
      type: "account_onboarding",
    });
    return { url: link.url };
  });

export const createConnectLoginLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY ?? "");
    const { userId } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.stripe_connect_account_id) {
      throw new Error("Compte Stripe non connecté");
    }
    const link = await stripe.accounts.createLoginLink(profile.stripe_connect_account_id);
    return { url: link.url };
  });

export const getConnectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.stripe_connect_account_id) {
      return { connected: false, charges_enabled: false, payouts_enabled: false, details_submitted: false };
    }
    const s = await syncStatus(profile.stripe_connect_account_id, userId);
    return { connected: true, ...s };
  });
