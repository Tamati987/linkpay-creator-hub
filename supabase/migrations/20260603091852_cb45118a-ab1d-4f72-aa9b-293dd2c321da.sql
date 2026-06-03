CREATE TABLE public.commission_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  declared_amount_cents integer NOT NULL,
  commission_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

GRANT SELECT ON public.commission_payments TO authenticated;
GRANT ALL ON public.commission_payments TO service_role;

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own commission payments"
ON public.commission_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_commission_payments_user ON public.commission_payments(user_id, created_at DESC);