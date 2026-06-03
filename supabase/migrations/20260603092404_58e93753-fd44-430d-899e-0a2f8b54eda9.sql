REVOKE SELECT (stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled) ON public.profiles FROM anon, authenticated;

REVOKE SELECT (file_path, payout_url) ON public.products FROM anon, authenticated;