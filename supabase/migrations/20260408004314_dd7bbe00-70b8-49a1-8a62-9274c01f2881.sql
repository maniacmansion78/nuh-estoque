
-- 1. Fix profiles SELECT: users can only see their own profile, admins can see all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. Fix user_roles SELECT: users can only see their own roles, admins can see all
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('non-conformities', 'nc-reports');

-- 4. Fix nc-reports SELECT policy: change from public to authenticated
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Authenticated users can read nc-reports" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('nc-reports', 'non-conformities'));

-- 5. Add DELETE policies on storage buckets (admin only)
CREATE POLICY "Admins can delete storage objects" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('non-conformities', 'nc-reports')
    AND public.has_role(auth.uid(), 'admin')
  );

-- 6. Add UPDATE policies on storage buckets (admin only)
CREATE POLICY "Admins can update storage objects" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('non-conformities', 'nc-reports')
    AND public.has_role(auth.uid(), 'admin')
  );
