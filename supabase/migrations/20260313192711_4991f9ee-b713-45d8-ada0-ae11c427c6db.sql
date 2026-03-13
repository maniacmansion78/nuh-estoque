
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete categories" ON public.categories FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update categories" ON public.categories FOR UPDATE TO authenticated USING (true);

INSERT INTO public.categories (name) VALUES ('Bebidas'), ('Importados'), ('Proteínas'), ('Temperos'), ('Vegetais');
