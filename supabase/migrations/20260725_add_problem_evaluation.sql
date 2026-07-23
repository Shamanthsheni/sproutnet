ALTER TABLE problems
ADD COLUMN IF NOT EXISTS difficulty_score numeric,
ADD COLUMN IF NOT EXISTS difficulty_label text,
ADD COLUMN IF NOT EXISTS leaderboard_weight numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS impact_score numeric,
ADD COLUMN IF NOT EXISTS estimated_hours integer,
ADD COLUMN IF NOT EXISTS estimated_weeks integer,
ADD COLUMN IF NOT EXISTS evaluation_json jsonb,
ADD COLUMN IF NOT EXISTS evaluated_at timestamptz;
