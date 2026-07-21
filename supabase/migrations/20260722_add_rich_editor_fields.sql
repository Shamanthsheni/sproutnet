-- Extend blog_posts with rich-editor metadata fields
-- These are all nullable/defaulted so existing rows are unaffected.

alter table public.blog_posts
  add column if not exists cover_image    text,
  add column if not exists slug           text,
  add column if not exists excerpt        text,
  add column if not exists tags           text[] not null default '{}',
  add column if not exists category       text,
  add column if not exists seo_title      text,
  add column if not exists seo_description text,
  add column if not exists status         text not null default 'published'
    check (status in ('draft', 'published'));

-- Unique slug per post (allow null for backwards compat)
create unique index if not exists blog_posts_slug_unique
  on public.blog_posts (slug)
  where slug is not null;

-- Index for draft/published filtering
create index if not exists blog_posts_status_idx
  on public.blog_posts (status);
