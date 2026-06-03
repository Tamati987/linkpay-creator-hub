-- Restrict public SELECT to non-sensitive columns
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, bio, avatar_url, cover_url, is_pro, purchased_avatars, created_at, updated_at) ON public.profiles TO anon, authenticated;

REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, user_id, title, description, price_cents, image_url, position, payout_url, created_at) ON public.products TO anon, authenticated;