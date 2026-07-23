ALTER TABLE submissions ADD COLUMN IF NOT EXISTS score numeric;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS judge_feedback text;
