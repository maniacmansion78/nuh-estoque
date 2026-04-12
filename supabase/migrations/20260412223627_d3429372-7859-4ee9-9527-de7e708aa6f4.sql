-- Fix 1: nc-reports public access - change from public to authenticated
DROP POLICY IF EXISTS "Anyone can view nc-reports" ON storage.objects;
CREATE POLICY "Authenticated can view nc-reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'nc-reports');

-- Fix 2: Restrict profile self-update to safe fields only (prevent privilege escalation)
DROP POLICY IF EXISTS "Users can update own safe fields" ON public.profiles;
CREATE POLICY "Users can update own safe fields"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND blocked = (SELECT p.blocked FROM public.profiles p WHERE p.user_id = auth.uid())
  AND trial_ends_at IS NOT DISTINCT FROM (SELECT p.trial_ends_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND movement_permission = (SELECT p.movement_permission FROM public.profiles p WHERE p.user_id = auth.uid())
);