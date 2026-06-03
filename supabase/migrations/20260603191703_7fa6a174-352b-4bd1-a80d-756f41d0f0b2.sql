CREATE OR REPLACE FUNCTION public.enforce_free_product_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_pro_user boolean;
BEGIN
  SELECT is_pro INTO is_pro_user FROM public.profiles WHERE id = NEW.user_id;
  IF NOT COALESCE(is_pro_user, false) THEN
    RAISE EXCEPTION 'pro_required'
      USING HINT = 'Les ventes de produits sont réservées aux abonnés Pro.';
  END IF;
  RETURN NEW;
END;
$function$;