-- Create the blog-images storage bucket (public read, authenticated write)
-- Run this in the Supabase SQL Editor or apply via migrations.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,                                      -- public read (no signed URLs needed)
  10485760,                                  -- 10 MB max per file
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do nothing;

-- ── RLS Policies ──

-- 1. Anyone can read (SELECT) from the public bucket
create policy "blog-images: public read"
  on storage.objects for select
  using ( bucket_id = 'blog-images' );

-- 2. Authenticated users can upload (INSERT)
create policy "blog-images: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'blog-images' );

-- 3. Users can replace their own files (UPDATE)
create policy "blog-images: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'blog-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Users can delete their own files (DELETE)
create policy "blog-images: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'blog-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
