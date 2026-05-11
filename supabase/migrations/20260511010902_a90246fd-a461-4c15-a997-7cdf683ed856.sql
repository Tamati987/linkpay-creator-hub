
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE TABLE IF NOT EXISTS public.sales_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  product_id uuid,
  type text NOT NULL CHECK (type IN ('subscription', 'product')),
  buyer_email text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id text,
  stripe_session_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller views own sales"
  ON public.sales_logs
  FOR SELECT
  USING (auth.uid() = seller_id);

CREATE INDEX IF NOT EXISTS sales_logs_seller_idx ON public.sales_logs(seller_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS sales_logs_pi_unique
  ON public.sales_logs(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
