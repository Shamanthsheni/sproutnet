-- Backfill: teams created before team-based enrollments existed.
-- Gives every team member an active enrollment on the team's problem so the
-- problem shows in their dashboard and unlocks /problems/[id]/submit.

insert into public.enrollments (problem_id, student_id, status)
select t.problem_id, tm.user_id, 'active'
from public.team_members tm
join public.teams t on t.id = tm.team_id
where not exists (
  select 1 from public.enrollments e
  where e.problem_id = t.problem_id
    and e.student_id = tm.user_id
);

-- Reactivate cancelled/completed enrollments for current team members
update public.enrollments e
set status = 'active'
from public.team_members tm
join public.teams t on t.id = tm.team_id
where e.problem_id = t.problem_id
  and e.student_id = tm.user_id
  and e.status <> 'active'
  and exists (
    select 1 from public.team_members tm2
    where tm2.user_id = e.student_id
      and tm2.team_id = t.id
  );
