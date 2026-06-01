
-- 1) Lock down billing/pro columns on profiles against client writes
CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user <> 'service_role' THEN
    NEW.is_pro := OLD.is_pro;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.purchased_avatars := OLD.purchased_avatars;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing ON public.profiles;
CREATE TRIGGER protect_profile_billing
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_columns();

-- 2) Hide Stripe identifiers from clients (only service_role can read them)
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.profiles FROM anon, authenticated;

-- 3) Hide private product file paths from clients
REVOKE SELECT (file_path) ON public.products FROM anon, authenticated;

-- 4) Purchases: only the Stripe webhook (service_role) may insert
DROP POLICY IF EXISTS "Anyone can insert a valid purchase" ON public.purchases;

-- 5) Newsletter: enforce email format + valid creator
ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_email_format;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_email_format
  CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' AND char_length(email) <= 254);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Subscribe to existing creator"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id));

-- 6) Avatars bucket: align storage policy with intended public read
DROP POLICY IF EXISTS "Authenticated users can read own avatar files" ON storage.objects;
CREATE POLICY "Avatar files are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');
