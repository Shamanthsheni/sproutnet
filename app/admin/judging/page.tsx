import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamEntryKeys, resolveParticipantType } from '@/lib/team-entries'
import JudgingQueue, { type JudgingRow } from './judging-queue'

export const dynamic = 'force-dynamic'

export default async function AdminJudgingPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('submissions')
    .select('id, milestone, status, participant_type, final_deliverables, f_understanding, f_solution, f_impact, f_rootcause, f_feasibility, f_risks, f_implementation, submitted_at, problem_id, student_id')
    .eq('stage', 'full')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
    .limit(200)

  type SubRow = {
    id: string
    milestone: number
    status: string
    participant_type: string | null
    final_deliverables: unknown
    f_understanding: string | null
    f_solution: string | null
    f_impact: string | null
    f_rootcause: string | null
    f_feasibility: string | null
    f_risks: string | null
    f_implementation: string | null
    submitted_at: string
    problem_id: string
    student_id: string
  }

  const rows = (data ?? []) as SubRow[]
  const problemIds = Array.from(new Set(rows.map(r => r.problem_id).filter(Boolean)))
  const studentIds = Array.from(new Set(rows.map(r => r.student_id).filter(Boolean)))

  const teamKeys = await getTeamEntryKeys(admin, studentIds)

  const [problemMap, studentMap] = await Promise.all([
    problemIds.length
      ? admin.from('problems').select('id, title, domain').in('id', problemIds).then(
          ({ data: probs }) => new Map(((probs ?? []) as Array<{ id: string; title: string; domain: string | null }>).map(p => [p.id, p]))
        )
      : Promise.resolve(new Map<string, { id: string; title: string; domain: string | null }>()),
    studentIds.length
      ? admin.from('users').select('id, name, dept, year').in('id', studentIds).then(
          ({ data: users }) => new Map(((users ?? []) as Array<{ id: string; name: string; dept: string | null; year: string | null }>).map(u => [u.id, u]))
        )
      : Promise.resolve(new Map<string, { id: string; name: string; dept: string | null; year: string | null }>()),
  ])

  const queue: JudgingRow[] = rows.map(r => {
    const p = problemMap.get(r.problem_id)
    const s = studentMap.get(r.student_id)
    return {
      id: r.id,
      status: r.status,
      participantType: resolveParticipantType(r.participant_type, r.student_id, r.problem_id, teamKeys),
      deliverables: Array.isArray(r.final_deliverables) ? r.final_deliverables : [],
      fields: {
        f_understanding: r.f_understanding ?? '',
        f_solution: r.f_solution ?? '',
        f_impact: r.f_impact ?? '',
        f_rootcause: r.f_rootcause ?? '',
        f_feasibility: r.f_feasibility ?? '',
        f_risks: r.f_risks ?? '',
        f_implementation: r.f_implementation ?? '',
      },
      submittedAt: r.submitted_at,
      problemTitle: p?.title ?? 'Unknown problem',
      problemDomain: p?.domain ?? null,
      problemId: r.problem_id,
      studentName: s?.name ?? 'Unknown student',
      studentDept: s?.dept ?? null,
      studentYear: s?.year ?? null,
    }
  })

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10
        }}>
          JUDGING · STAGE-1 QUEUE
        </div>
        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 'clamp(22px, 4.5vw, 28px)',
          fontWeight: 950,
          color: 'var(--text-primary)',
          letterSpacing: '-0.6px',
          marginBottom: 8
        }}>
          Judging queue
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
          Review each written solution, score it 0–10, then Approve to unlock the builder&apos;s
          Stage-2 final upload — or Reject to send it back.
        </p>
      </div>

      <JudgingQueue rows={queue} />

      <div style={{
        marginTop: 18,
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 12,
        color: 'var(--text-muted)'
      }}>
        Click <strong>Review</strong> to read the full submission inline — no page hops needed.
        Approved solutions sync to the leaderboard automatically; approved builders get the
        green “Upload Final Work” button on their dashboard and the public /solutions page.
      </div>
    </div>
  )
}
