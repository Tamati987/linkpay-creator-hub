ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS purchased_avatars text[] NOT NULL DEFAULT '{}';