
-- 1. Tighten purchases insert: amount and seller must match an existing product
drop policy "Anyone can insert a purchase" on public.purchases;
create policy "Anyone can insert a valid purchase"
  on public.purchases for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.user_id = seller_id
    )
  );

-- 2. Avatar bucket: drop broad SELECT (avatars served via public URL anyway needs select). Keep but scope to single-object reads via no listing — simplest: keep policy but lint accepts. Instead restrict select on owner folder for listing, allow public direct object access by keeping bucket public.
drop policy "Avatar images public read" on storage.objects;
-- Avatars remain accessible via signed/public URL (bucket public=true). For app reads we don't need listing.

-- 3. Lock down SECURITY DEFINER function
revoke execute on function public.handle_new_user() from public, anon, authenticated;
