
-- Restrict authenticated sellers to non-sensitive columns only via column-level GRANTs.
-- RLS row policies still apply on top of these column grants.

REVOKE SELECT ON public.purchases FROM authenticated;
REVOKE SELECT ON public.purchases FROM anon;
GRANT SELECT (id, product_id, seller_id, amount_cents, created_at) ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

REVOKE SELECT ON public.sales_logs FROM authenticated;
REVOKE SELECT ON public.sales_logs FROM anon;
GRANT SELECT (id, product_id, seller_id, amount_cents, currency, type, created_at) ON public.sales_logs TO authenticated;
GRANT ALL ON public.sales_logs TO service_role;
