-- Enable Row Level Security
ALTER TABLE public.discussion ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow authenticated read on discussion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discussion' AND policyname = 'Allow authenticated read on discussion'
  ) THEN
    CREATE POLICY "Allow authenticated read on discussion" ON public.discussion
      FOR SELECT USING (true);
  END IF;
END $$;

-- Insert policy: Allow authenticated insert on discussion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discussion' AND policyname = 'Allow authenticated insert on discussion'
  ) THEN
    CREATE POLICY "Allow authenticated insert on discussion" ON public.discussion
      FOR INSERT WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;
