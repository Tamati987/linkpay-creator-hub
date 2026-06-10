
-- Restrict column-level SELECT on profiles to safe public fields only
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, bio, avatar_url, created_at, updated_at, is_pro, cover_url, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, theme) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Restrict column-level SELECT on products: hide file_path from public
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, user_id, title, description, price_cents, position, created_at, image_url, payout_url) ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
