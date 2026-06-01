CREATE OR REPLACE FUNCTION public.enforce_pro_cover_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_is_pro boolean;
BEGIN
  IF NEW.cover_url IS NOT NULL AND NEW.cover_url IS DISTINCT FROM COALESCE(OLD.cover_url, NULL) THEN
    SELECT is_pro INTO user_is_pro FROM public.profiles WHERE id = NEW.id;
    IF NOT COALESCE(user_is_pro, false) THEN
      NEW.cover_url := OLD.cover_url;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_pro_cover_url_trigger ON public.profiles;
CREATE TRIGGER enforce_pro_cover_url_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_pro_cover_url();