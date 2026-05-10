
-- Pro flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

-- Link kind for paywall logic
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'standard';

ALTER TABLE public.links
  DROP CONSTRAINT IF EXISTS links_kind_check;
ALTER TABLE public.links
  ADD CONSTRAINT links_kind_check CHECK (kind IN ('standard','social','video'));

-- Newsletter subscribers per creator
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owner views subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Owner views subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner deletes subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Owner deletes subscribers"
  ON public.newsletter_subscribers
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_user ON public.newsletter_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user ON public.links(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);
