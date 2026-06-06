CREATE OR REPLACE FUNCTION public.enforce_theme_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pro_themes text[] := ARRAY['aurora','sunset','midnight','emerald','holographic'];
  stored_is_pro boolean;
BEGIN
  IF NEW.theme = ANY(pro_themes) THEN
    SELECT is_pro INTO stored_is_pro FROM public.profiles WHERE id = NEW.id;
    IF NOT COALESCE(stored_is_pro, false) THEN
      RAISE EXCEPTION 'Theme % requires a Pro plan', NEW.theme;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;