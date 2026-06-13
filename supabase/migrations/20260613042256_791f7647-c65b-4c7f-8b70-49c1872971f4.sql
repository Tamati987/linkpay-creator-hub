
-- 1. Revoke SELECT on sensitive profile columns from anon/authenticated.
--    Server functions use service_role (supabaseAdmin) and are unaffected.
REVOKE SELECT (stripe_customer_id, stripe_connect_account_id, stripe_subscription_id, purchased_avatars)
  ON public.profiles FROM anon, authenticated;

-- Grant SELECT on remaining safe columns explicitly to keep the table readable.
GRANT SELECT (id, username, display_name, bio, avatar_url, cover_url, theme, is_pro,
              stripe_connect_charges_enabled, stripe_connect_payouts_enabled,
              created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- 2. Revoke SELECT on private product file_path from anon/authenticated.
REVOKE SELECT (file_path) ON public.products FROM anon, authenticated;

GRANT SELECT (id, user_id, title, description, price_cents, image_url, position,
              payout_url, created_at)
  ON public.products TO anon, authenticated;
-- Keep INSERT/UPDATE on file_path for owners (RLS still enforces ownership).
GRANT INSERT (file_path), UPDATE (file_path) ON public.products TO authenticated;

-- 3. Restrict friendship status transitions: addressee may only set 'accepted'.
DROP POLICY IF EXISTS "Addressee can update status" ON public.friendships;
CREATE POLICY "Addressee can update status"
  ON public.friendships
  FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id AND status = 'accepted'::friendship_status);
