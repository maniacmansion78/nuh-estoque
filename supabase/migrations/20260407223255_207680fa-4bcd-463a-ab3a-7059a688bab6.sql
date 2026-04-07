
-- =============================================
-- SECURITY FIX: Restrict profile self-update
-- =============================================

-- Drop the overly permissive profile update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can only update their own display_name and job_title
CREATE POLICY "Users can update own safe fields"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a function that restricts which columns users can update
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

CREATE TRIGGER trg_check_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_profile_update();

-- Admin can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- RECIPE SYSTEM TABLES
-- =============================================

-- Recipes table
CREATE TABLE public.recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Entrada',
  portions integer NOT NULL DEFAULT 1,
  total_cost numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view recipes" ON public.recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert recipes" ON public.recipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update recipes" ON public.recipes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete recipes" ON public.recipes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Recipe ingredients table
CREATE TABLE public.recipe_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  gross_weight numeric NOT NULL DEFAULT 0,
  correction_factor numeric NOT NULL DEFAULT 1,
  net_weight numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  ingredient_cost numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'g',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view recipe_ingredients" ON public.recipe_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert recipe_ingredients" ON public.recipe_ingredients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update recipe_ingredients" ON public.recipe_ingredients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete recipe_ingredients" ON public.recipe_ingredients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Dish sales table (daily dish sales tracking)
CREATE TABLE public.dish_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  date date NOT NULL DEFAULT CURRENT_DATE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.dish_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dish_sales" ON public.dish_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert dish_sales" ON public.dish_sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can delete dish_sales" ON public.dish_sales FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update dish_sales" ON public.dish_sales FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
