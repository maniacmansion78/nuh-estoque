
-- Create storage bucket for non-conformity photos
INSERT INTO storage.buckets (id, name, public) VALUES ('non-conformities', 'non-conformities', true);

-- Create non_conformities table
CREATE TABLE public.non_conformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  photo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.non_conformities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view non_conformities"
  ON public.non_conformities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert non_conformities"
  ON public.non_conformities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete non_conformities"
  ON public.non_conformities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for non-conformities bucket
CREATE POLICY "Authenticated users can upload non-conformity photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'non-conformities');

CREATE POLICY "Anyone can view non-conformity photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'non-conformities');
