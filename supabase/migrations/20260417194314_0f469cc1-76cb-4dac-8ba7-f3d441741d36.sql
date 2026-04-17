ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS correction_factor_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS correction_factor_percent numeric(5,2),
  ADD COLUMN IF NOT EXISTS correction_factor_type text,
  ADD COLUMN IF NOT EXISTS correction_factor_note text;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_correction_factor_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_correction_factor_type_check
  CHECK (correction_factor_type IS NULL OR correction_factor_type IN ('weight', 'price'));