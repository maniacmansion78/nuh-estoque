
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'in',
  quantity NUMERIC NOT NULL DEFAULT 0,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movements"
  ON public.movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own movements"
  ON public.movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own movements"
  ON public.movements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
