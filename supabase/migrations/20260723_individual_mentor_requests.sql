-- Allow individual mentor requests (without a team)
ALTER TABLE public.mentor_requests
  ALTER COLUMN team_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS is_individual BOOLEAN NOT NULL DEFAULT false;

-- Drop old unique constraint and add a new one that handles null team_id
ALTER TABLE public.mentor_requests DROP CONSTRAINT IF EXISTS mentor_requests_team_id_mentor_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_requests_team_mentor 
  ON public.mentor_requests(team_id, mentor_id) WHERE team_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_requests_individual 
  ON public.mentor_requests(requested_by, mentor_id) WHERE team_id IS NULL;
