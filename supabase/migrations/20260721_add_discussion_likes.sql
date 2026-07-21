-- Migration: Add likes_count column to discussion table and create discussion_likes tracking table

ALTER TABLE public.discussion
ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.discussion_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussion(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(discussion_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discussion_likes' AND policyname = 'Allow authenticated read on discussion_likes'
  ) THEN
    CREATE POLICY "Allow authenticated read on discussion_likes" ON public.discussion_likes
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discussion_likes' AND policyname = 'Allow users to insert own likes'
  ) THEN
    CREATE POLICY "Allow users to insert own likes" ON public.discussion_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discussion_likes' AND policyname = 'Allow users to delete own likes'
  ) THEN
    CREATE POLICY "Allow users to delete own likes" ON public.discussion_likes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
