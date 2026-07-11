ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shipping_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_discount_cents integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ADD CONSTRAINT products_shipping_cents_nonneg CHECK (shipping_cents >= 0),
  ADD CONSTRAINT products_shipping_discount_nonneg CHECK (shipping_discount_cents >= 0),
  ADD CONSTRAINT products_shipping_discount_le_shipping CHECK (shipping_discount_cents <= shipping_cents);

GRANT SELECT (shipping_cents, shipping_discount_cents) ON public.products TO anon, authenticated;