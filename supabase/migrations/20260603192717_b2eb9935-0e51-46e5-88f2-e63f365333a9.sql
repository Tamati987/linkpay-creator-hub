CREATE OR REPLACE FUNCTION public.enforce_free_product_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_pro_user boolean;
  current_count int;
BEGIN
  SELECT is_pro INTO is_pro_user FROM public.profiles WHERE id = NEW.user_id;
  IF is_pro_user THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO current_count
  FROM public.products
  WHERE user_id = NEW.user_id;

  IF current_count >= 1 THEN
    RAISE EXCEPTION 'free_plan_limit_reached'
      USING HINT = 'Upgrade to Pro for unlimited products';
  END IF;

  RETURN NEW;
END;
$function$;