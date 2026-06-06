
-- FOLLOWS
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

GRANT SELECT ON public.follows TO anon, authenticated;
GRANT INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows public read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users insert own follow" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users delete own follow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- NOTIFICATION SETTINGS
CREATE TABLE public.notification_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  new_link boolean NOT NULL DEFAULT true,
  new_product boolean NOT NULL DEFAULT true,
  new_follow boolean NOT NULL DEFAULT true,
  profile_update boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own settings select" ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own settings insert" ON public.notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own settings update" ON public.notification_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('new_link','new_product','new_follow','profile_update')),
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- HELPER: check user setting (default true if missing)
CREATE OR REPLACE FUNCTION public.notif_enabled(_user_id uuid, _type text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE _type
    WHEN 'new_link' THEN COALESCE((SELECT new_link FROM public.notification_settings WHERE user_id = _user_id), true)
    WHEN 'new_product' THEN COALESCE((SELECT new_product FROM public.notification_settings WHERE user_id = _user_id), true)
    WHEN 'new_follow' THEN COALESCE((SELECT new_follow FROM public.notification_settings WHERE user_id = _user_id), true)
    WHEN 'profile_update' THEN COALESCE((SELECT profile_update FROM public.notification_settings WHERE user_id = _user_id), true)
    ELSE true END
$$;

-- HELPER: trim to last 50
CREATE OR REPLACE FUNCTION public.trim_notifications(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = _user_id
    AND id NOT IN (
      SELECT id FROM public.notifications WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 50
    );
END $$;

-- TRIGGER: new follow
CREATE OR REPLACE FUNCTION public.on_follow_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
BEGIN
  IF NOT public.notif_enabled(NEW.following_id, 'new_follow') THEN RETURN NEW; END IF;
  SELECT COALESCE(NULLIF(display_name,''), username) INTO actor_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications(user_id, actor_id, type, message, link)
  VALUES (NEW.following_id, NEW.follower_id, 'new_follow',
    COALESCE(actor_name,'Someone') || ' a commencé à vous suivre',
    '/' || (SELECT username FROM public.profiles WHERE id = NEW.follower_id));
  PERFORM public.trim_notifications(NEW.following_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_follow_created AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.on_follow_created();

-- TRIGGER: new link → fan out
CREATE OR REPLACE FUNCTION public.on_link_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
  actor_username text;
  r record;
BEGIN
  SELECT COALESCE(NULLIF(display_name,''), username), username INTO actor_name, actor_username
  FROM public.profiles WHERE id = NEW.user_id;
  FOR r IN SELECT follower_id FROM public.follows WHERE following_id = NEW.user_id LOOP
    IF public.notif_enabled(r.follower_id, 'new_link') THEN
      INSERT INTO public.notifications(user_id, actor_id, type, message, link)
      VALUES (r.follower_id, NEW.user_id, 'new_link',
        COALESCE(actor_name,'Quelqu''un') || ' a ajouté un nouveau lien',
        '/' || actor_username);
      PERFORM public.trim_notifications(r.follower_id);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_link_created AFTER INSERT ON public.links
FOR EACH ROW EXECUTE FUNCTION public.on_link_created();

-- TRIGGER: new product → fan out
CREATE OR REPLACE FUNCTION public.on_product_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
  actor_username text;
  r record;
BEGIN
  SELECT COALESCE(NULLIF(display_name,''), username), username INTO actor_name, actor_username
  FROM public.profiles WHERE id = NEW.user_id;
  FOR r IN SELECT follower_id FROM public.follows WHERE following_id = NEW.user_id LOOP
    IF public.notif_enabled(r.follower_id, 'new_product') THEN
      INSERT INTO public.notifications(user_id, actor_id, type, message, link)
      VALUES (r.follower_id, NEW.user_id, 'new_product',
        COALESCE(actor_name,'Quelqu''un') || ' a ajouté un nouveau produit',
        '/' || actor_username);
      PERFORM public.trim_notifications(r.follower_id);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_product_created AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.on_product_created();

-- TRIGGER: profile update (avatar or bio)
CREATE OR REPLACE FUNCTION public.on_profile_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
  r record;
BEGIN
  IF NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url AND NEW.bio IS NOT DISTINCT FROM OLD.bio THEN
    RETURN NEW;
  END IF;
  actor_name := COALESCE(NULLIF(NEW.display_name,''), NEW.username);
  FOR r IN SELECT follower_id FROM public.follows WHERE following_id = NEW.id LOOP
    IF public.notif_enabled(r.follower_id, 'profile_update') THEN
      INSERT INTO public.notifications(user_id, actor_id, type, message, link)
      VALUES (r.follower_id, NEW.id, 'profile_update',
        COALESCE(actor_name,'Quelqu''un') || ' a mis à jour son profil',
        '/' || NEW.username);
      PERFORM public.trim_notifications(r.follower_id);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_profile_updated AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_profile_updated();
