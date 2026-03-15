alter table if exists public.blog_comments
  add column if not exists parent_comment_id uuid references public.blog_comments(id) on delete cascade;

create index if not exists blog_comments_parent_comment_id_idx
  on public.blog_comments (parent_comment_id);
