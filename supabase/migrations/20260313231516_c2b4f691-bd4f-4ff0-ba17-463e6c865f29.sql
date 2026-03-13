
INSERT INTO storage.buckets (id, name, public) VALUES ('nc-reports', 'nc-reports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload nc-reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'nc-reports');
CREATE POLICY "Anyone can view nc-reports" ON storage.objects FOR SELECT USING (bucket_id = 'nc-reports');
