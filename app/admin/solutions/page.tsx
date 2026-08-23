import { createAdminClient } from '@/lib/supabase/admin'
import AdminSolutionsList, { type AdminSolutionRow } from './solutions-list'

export const dynamic = 'force-dynamic'

export default async function AdminSolutionsPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('submissions')
    .select('id, stage, milestone, status, score, participant_type, final_deliverables, f_understanding, f_solution, f_impact, f_rootcause, f_feasibility, f_risks, f_implementation, created_at, problem_id, student_id')
    .eq('stage', 'full')
    .order('created_at', { ascending: false })
    .limit(200)

  type SubRow = {
    id: string
    status: string
    score: number | null
    participant_type: string | null
    final_deliverables: unknown
    f_understanding: string | null
    f_solution: string | null
    f_impact: string | null
    f_rootcause: string | null
    f_feasibility: string | null
    f_risks: string | null
    f_implementation: string | null
    created_at: string
    problem_id: string
    student_id: string
  }

  const rows = (data ?? []) as SubRow[]
  const problemIds = Array.from(new Set(rows.map(r => r.problem_id).filter(Boolean)))
  const studentIds = Array.from(new Set(rows.map(r => r.student_id).filter(Boolean)))

  const problemById = new Map<string, { title: string; domain: string | null; team_mode: string | null }>()
  if (problemIds.length > 0) {
    const { data: probs } = await admin
      .from('problems')
      .select('id, title, domain, team_mode')
      .in('id', problemIds)
    for (const p of (probs ?? []) as Array<{ id: string; title: string; domain: string | null; team_mode: string | null }>) {
      problemById.set(p.id, { title: p.title, domain: p.domain, team_mode: p.team_mode })
    }
  }

  const studentById = new Map<string, { name: string; dept: string | null; year: string | null }>()
  if (studentIds.length > 0) {
    const { data: users } = await admin
      .from('users')
      .select('id, name, dept, year')
      .in('id', studentIds)
    for (const u of (users ?? []) as Array<{ id: string; name: string; dept: string | null; year: string | null }>) {
      studentById.set(u.id, { name: u.name, dept: u.dept, year: u.year })
    }
  }

  const solutions: AdminSolutionRow[] = rows.map(r => {
    const p = problemById.get(r.problem_id)
    const s = studentById.get(r.student_id)
    return {
      id: r.id,
      status: r.status,
      score: r.score ?? null,
      participantType: r.participant_type === 'team' ? 'team' : 'individual',
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
      createdAt: r.created_at,
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
          SOLUTIONS · ALL SUBMISSIONS
        </div>
        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 'clamp(22px, 4.5vw, 28px)',
          fontWeight: 950,
          color: 'var(--text-primary)',
          letterSpacing: '-0.6px',
          marginBottom: 8
        }}>
          Uploaded solutions
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
          Every full submission with its written solution, attached files, links, and deliverables. Showing latest 200.
        </p>
      </div>

      <AdminSolutionsList solutions={solutions} />
    </div>
  )
}
