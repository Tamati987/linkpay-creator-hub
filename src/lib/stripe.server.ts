import Stripe from "stripe";

let _stripe: Stripe | null = null;
let _stripeKey: string | null = null;

export function getStripe(secretKey: string) {
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY missing");
  if (_stripe && _stripeKey === secretKey) return _stripe;
  _stripeKey = secretKey;
  _stripe = new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
  return _stripe;
}
