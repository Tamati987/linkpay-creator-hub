
CREATE OR REPLACE FUNCTION public.enforce_free_link_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_pro_user boolean;
  current_count int;
  max_allowed int;
BEGIN
  IF NEW.kind NOT IN ('social', 'video') THEN
    RETURN NEW;
  END IF;

  SELECT is_pro INTO is_pro_user FROM public.profiles WHERE id = NEW.user_id;
  IF is_pro_user THEN
    RETURN NEW;
  END IF;

  IF NEW.kind = 'social' THEN
    max_allowed := 2;
  ELSE
    max_allowed := 1;
  END IF;

  SELECT count(*) INTO current_count
  FROM public.links
  WHERE user_id = NEW.user_id AND kind = NEW.kind;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'free_plan_limit_reached'
      USING HINT = 'Upgrade to Pro for unlimited ' || NEW.kind || ' links';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_link_quota_trg ON public.links;
CREATE TRIGGER enforce_free_link_quota_trg
  BEFORE INSERT ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_link_quota();

CREATE OR REPLACE FUNCTION public.enforce_free_product_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS enforce_free_product_quota_trg ON public.products;
CREATE TRIGGER enforce_free_product_quota_trg
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_product_quota();

REVOKE EXECUTE ON FUNCTION public.enforce_free_link_quota() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_free_product_quota() FROM PUBLIC, anon, authenticated;
