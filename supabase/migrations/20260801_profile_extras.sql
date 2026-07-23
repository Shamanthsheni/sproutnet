alter table public.users add column if not exists bio text;
alter table public.users add column if not exists github text;
alter table public.users add column if not exists linkedin text;
alter table public.users add column if not exists twitter text;
alter table public.users add column if not exists avatar_url text;

-- Storage bucket for profile avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do nothing;

create policy "profile-avatars: public read"
  on storage.objects for select
  using ( bucket_id = 'profile-avatars' );

create policy "profile-avatars: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'profile-avatars' );

create policy "profile-avatars: owner update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'profile-avatars' );

create policy "profile-avatars: owner delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'profile-avatars' );
