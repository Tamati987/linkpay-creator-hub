
CREATE OR REPLACE FUNCTION public.enforce_premium_avatar_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  premium_urls text[] := ARRAY[
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Aria',
    'https://api.dicebear.com/9.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/9.x/big-smile/svg?seed=Luna',
    'https://api.dicebear.com/9.x/croodles/svg?seed=Nova',
    'https://api.dicebear.com/9.x/lorelei/svg?seed=Iris',
    'https://api.dicebear.com/9.x/micah/svg?seed=Leo',
    'https://api.dicebear.com/9.x/miniavs/svg?seed=Sky',
    'https://api.dicebear.com/9.x/notionists/svg?seed=Aki',
    'https://api.dicebear.com/9.x/open-peeps/svg?seed=Zoe',
    'https://api.dicebear.com/9.x/personas/svg?seed=Kai',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Rex',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=Sun',
    'https://api.dicebear.com/9.x/big-ears/svg?seed=Pip',
    'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Max',
    'https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=Eve',
    'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Volt',
    'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Joy',
    'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Mei',
    'https://api.dicebear.com/9.x/notionists-neutral/svg?seed=Ren',
    'https://api.dicebear.com/9.x/personas/svg?seed=Tao'
  ];
  premium_ids text[] := ARRAY[
    'pro-1','pro-2','pro-3','pro-4','pro-5','pro-6','pro-7','pro-8','pro-9','pro-10',
    'pro-11','pro-12','pro-13','pro-14','pro-15','pro-16','pro-17','pro-18','pro-19','pro-20'
  ];
  idx int;
  required_id text;
BEGIN
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.avatar_url IS NULL OR NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url THEN
    RETURN NEW;
  END IF;
  idx := array_position(premium_urls, NEW.avatar_url);
  IF idx IS NULL THEN
    RETURN NEW;
  END IF;
  required_id := premium_ids[idx];
  IF NOT (COALESCE(NEW.purchased_avatars, ARRAY[]::text[]) @> ARRAY[required_id]
       OR COALESCE(OLD.purchased_avatars, ARRAY[]::text[]) @> ARRAY[required_id]) THEN
    RAISE EXCEPTION 'premium_avatar_not_owned' USING HINT = 'Purchase this avatar before applying it';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_premium_avatar_ownership_trg ON public.profiles;
CREATE TRIGGER enforce_premium_avatar_ownership_trg
BEFORE UPDATE OF avatar_url ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_premium_avatar_ownership();
