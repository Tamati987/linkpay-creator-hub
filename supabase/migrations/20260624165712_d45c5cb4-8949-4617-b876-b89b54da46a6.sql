
-- Restrict sensitive profiles columns from public read
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, bio, avatar_url, cover_url, created_at, updated_at, is_pro, theme) ON public.profiles TO anon, authenticated;

-- Restrict products.file_path from public read (kept writable for owner)
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, user_id, title, description, price_cents, image_url, payout_url, position, created_at) ON public.products TO anon, authenticated;

-- Explicitly block direct writes to purchases from clients
CREATE POLICY "No client inserts to purchases" ON public.purchases AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates to purchases" ON public.purchases AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from purchases" ON public.purchases AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
