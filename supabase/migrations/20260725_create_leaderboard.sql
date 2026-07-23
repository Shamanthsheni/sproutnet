DROP VIEW IF EXISTS leaderboard CASCADE;

CREATE TABLE leaderboard (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rank integer,
  builder_score numeric DEFAULT 0,
  name text,
  dept text,
  year text,
  profile_slug text UNIQUE,
  attempted integer DEFAULT 0,
  avg_score numeric DEFAULT 0,
  milestones_done integer DEFAULT 0,
  badges text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Admin can write leaderboard" ON leaderboard
  FOR ALL USING (true) WITH CHECK (true);
