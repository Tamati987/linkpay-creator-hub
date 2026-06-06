
-- Revoke public read access on sensitive Stripe columns of profiles
REVOKE SELECT (stripe_customer_id, stripe_subscription_id, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled) ON public.profiles FROM anon, authenticated;

-- Revoke public read access on internal storage file_path of products
REVOKE SELECT (file_path) ON public.products FROM anon, authenticated;
