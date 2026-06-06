
-- Restore safe column SELECT grants on profiles (excluding Stripe columns)
GRANT SELECT (id, username, display_name, bio, avatar_url, cover_url, is_pro, theme, purchased_avatars, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Restore safe column SELECT grants on products (excluding file_path)
GRANT SELECT (id, user_id, title, description, price_cents, image_url, position, payout_url, created_at) ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
