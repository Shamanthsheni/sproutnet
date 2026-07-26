create extension if not exists "pgcrypto";

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  post_type text not null default 'knowledge'
    check (post_type in ('knowledge', 'question')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  cover_image text,
  slug text,
  excerpt text,
  tags text[] default '{}',
  category text,
  seo_title text,
  seo_description text,
  status text not null default 'published' check (status in ('draft', 'published'))
);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blog_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, user_id)
);

create index if not exists blog_posts_created_at_idx
  on public.blog_posts (created_at desc);

create index if not exists blog_comments_post_id_created_at_idx
  on public.blog_comments (post_id, created_at asc);

create index if not exists blog_post_likes_post_id_idx
  on public.blog_post_likes (post_id);

create index if not exists blog_post_likes_user_id_idx
  on public.blog_post_likes (user_id);
