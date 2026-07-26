alter table if exists public.blog_posts
  add column if not exists cover_image text,
  add column if not exists slug text,
  add column if not exists excerpt text,
  add column if not exists tags text[] default '{}',
  add column if not exists category text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists status text not null default 'published';

-- Add the check constraint if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.blog_posts'::regclass
    and conname = 'blog_posts_status_check'
  ) then
    alter table public.blog_posts
      add constraint blog_posts_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;
