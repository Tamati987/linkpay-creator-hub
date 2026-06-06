ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'neon';

-- Restrict pro themes via trigger
CREATE OR REPLACE FUNCTION public.enforce_theme_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pro_themes text[] := ARRAY['aurora','sunset','midnight','emerald','holographic'];
BEGIN
  IF NEW.theme = ANY(pro_themes) AND NEW.is_pro = false THEN
    RAISE EXCEPTION 'Theme % requires a Pro plan', NEW.theme;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_theme_plan_trigger ON public.profiles;
CREATE TRIGGER enforce_theme_plan_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_theme_plan();