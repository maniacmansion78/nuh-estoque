
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (true);

-- Seed with mock data
INSERT INTO public.suppliers (name, contact, email) VALUES
  ('Thai Fresh Imports', '(11) 99999-0001', 'contato@thaifresh.com'),
  ('Hortifruti Central', '(11) 99999-0002', 'vendas@horticentral.com'),
  ('Temperos do Oriente', '(11) 99999-0003', 'pedidos@temperosoriente.com'),
  ('Bebidas Premium', '(11) 99999-0004', 'contato@bebidaspremium.com');
