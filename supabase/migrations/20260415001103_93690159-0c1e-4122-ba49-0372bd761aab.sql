-- Fix privilege escalation: prevent users from inserting admin role for themselves
-- Drop the existing INSERT policy and create a more restrictive one
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles for others"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id != auth.uid()
);