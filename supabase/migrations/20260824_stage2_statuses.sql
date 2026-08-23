-- Stage-2 pipeline: admin approves or rejects a Stage-1 (7-field) solution.
-- 'approved' unlocks the student's final upload page (/problems/[id]/final-upload).

alter type public.submission_status add value if not exists 'approved';
alter type public.submission_status add value if not exists 'rejected';

-- 'judged' is kept for backwards compatibility with any existing rows.
