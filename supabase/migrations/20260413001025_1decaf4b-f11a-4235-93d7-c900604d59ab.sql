CREATE OR REPLACE FUNCTION public.check_profile_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service-role / server-side operations (auth.uid() is null)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- If user is admin, allow all changes
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  
  -- Non-admin users: prevent changing sensitive fields
  IF NEW.blocked IS DISTINCT FROM OLD.blocked THEN
    RAISE EXCEPTION 'Cannot modify blocked status';
  END IF;
  IF NEW.movement_permission IS DISTINCT FROM OLD.movement_permission THEN
    RAISE EXCEPTION 'Cannot modify movement_permission';
  END IF;
  IF NEW.temp_password IS DISTINCT FROM OLD.temp_password THEN
    RAISE EXCEPTION 'Cannot modify temp_password';
  END IF;
  IF NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN
    RAISE EXCEPTION 'Cannot modify trial_ends_at';
  END IF;
  
  RETURN NEW;
END;
$function$;