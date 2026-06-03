DROP POLICY IF EXISTS "Subscribe to existing creator" ON public.newsletter_subscribers;
REVOKE INSERT ON public.newsletter_subscribers FROM anon, authenticated;