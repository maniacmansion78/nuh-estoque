-- Fix: Add temp_password to the restricted fields in profile self-update
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
  AND temp_password = (SELECT p.temp_password FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- Fix: Remove dish_sales from realtime to prevent unauthorized channel subscriptions
ALTER PUBLICATION supabase_realtime DROP TABLE public.dish_sales;