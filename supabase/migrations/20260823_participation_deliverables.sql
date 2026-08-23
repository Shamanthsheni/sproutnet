-- Participation type + final deliverables on submissions.
-- problems.team_mode ('solo' | 'team' | 'both') already exists and controls who can participate.

alter table public.submissions
  add column if not exists participant_type text not null default 'individual';

alter table public.submissions
  drop constraint if exists submissions_participant_type_check;

alter table public.submissions
  add constraint submissions_participant_type_check
  check (participant_type in ('team', 'individual'));

-- Up to 5 final deliverables per submission:
-- [{ "kind": "link", "label": "Live app", "url": "https://..." },
--  { "kind": "file", "label": "Pitch deck", "url": "<storage url>", "name": "deck.pdf" }]
alter table public.submissions
  add column if not exists final_deliverables jsonb not null default '[]'::jsonb;
