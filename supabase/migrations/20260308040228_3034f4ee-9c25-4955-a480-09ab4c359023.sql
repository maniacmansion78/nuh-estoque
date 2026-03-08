CREATE POLICY "Admins can delete any movements"
ON public.movements
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));