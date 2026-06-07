
-- profiles: restrict sensitive columns from public reads via column-level grants
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, username, display_name, bio, avatar_url, cover_url,
  theme, is_pro, created_at, updated_at
) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- products: hide file_path from public; keep payout_url readable for buy links
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (
  id, user_id, title, description, price_cents, image_url,
  payout_url, position, created_at
) ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- products: enforce http(s) scheme on payout_url at the database level
ALTER TABLE public.products
  ADD CONSTRAINT products_payout_url_scheme
  CHECK (payout_url IS NULL OR payout_url ~* '^https?://');
