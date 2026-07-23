-- Fix messaging: enable Realtime + missing INSERT/UPDATE policies
-- Run this in Supabase SQL editor

-- 1. Add messages table to the realtime publication (needed for Postgres Changes to work)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Set replica identity (needed for DELETE/UPDATE changes, optional for INSERT but good practice)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 3. Add INSERT policy for messages (so users can send messages)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow conversation members insert messages') THEN
    CREATE POLICY "Allow conversation members insert messages" ON public.messages FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
    );
  END IF;
END $$;

-- 4. Add UPDATE policy for messages (so users can edit/delete their own messages)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow sender update own messages') THEN
    CREATE POLICY "Allow sender update own messages" ON public.messages FOR UPDATE USING (sender_id = auth.uid());
  END IF;
END $$;

-- 5. Enable RLS on conversation_members and add SELECT policy
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_members' AND policyname = 'Allow members read own conversations') THEN
    CREATE POLICY "Allow members read own conversations" ON public.conversation_members FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;
