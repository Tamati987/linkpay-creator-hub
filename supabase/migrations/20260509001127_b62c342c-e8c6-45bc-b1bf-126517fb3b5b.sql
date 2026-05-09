
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Links
create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.links enable row level security;
create policy "Links viewable by everyone" on public.links for select using (true);
create policy "Owner inserts links" on public.links for insert with check (auth.uid() = user_id);
create policy "Owner updates links" on public.links for update using (auth.uid() = user_id);
create policy "Owner deletes links" on public.links for delete using (auth.uid() = user_id);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price_cents int not null default 0 check (price_cents >= 0),
  file_path text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Products viewable by everyone" on public.products for select using (true);
create policy "Owner inserts products" on public.products for insert with check (auth.uid() = user_id);
create policy "Owner updates products" on public.products for update using (auth.uid() = user_id);
create policy "Owner deletes products" on public.products for delete using (auth.uid() = user_id);

-- Purchases (factice, sert à compter les "ventes" et calculer les gains)
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_email text,
  amount_cents int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.purchases enable row level security;
create policy "Anyone can insert a purchase" on public.purchases for insert with check (true);
create policy "Seller views own purchases" on public.purchases for select using (auth.uid() = seller_id);

-- Trigger d'auto-création de profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  i int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1),
    'user'
  );
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  if base_username = '' then base_username := 'user'; end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    i := i + 1;
    candidate := base_username || i::text;
  end loop;
  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'display_name', candidate));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('products', 'products', false);

-- Avatar policies (public read, owner write under their uid folder)
create policy "Avatar images public read"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Product file policies (owner-only access)
create policy "Owner reads product files"
  on storage.objects for select
  using (bucket_id = 'products' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Owner uploads product files"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Owner updates product files"
  on storage.objects for update
  using (bucket_id = 'products' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Owner deletes product files"
  on storage.objects for delete
  using (bucket_id = 'products' and auth.uid()::text = (storage.foldername(name))[1]);
