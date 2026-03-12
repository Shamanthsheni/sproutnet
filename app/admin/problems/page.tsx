import { createAdminClient } from '@/lib/supabase/admin'
import AdminProblemsList, { type AdminProblemRow } from './admin-problems-list'

type ProblemQueryRow = {
  id: string
  title: string
  domain: string
  problem_type: string
  status: string
  reward_amount: number | null
  milestones: number
  deadline: string
  submission_count: number | null
  created_at: string
  poster_id: string
}

export default async function AdminProblemsPage() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('problems')
    .select('id, title, domain, problem_type, status, reward_amount, milestones, deadline, submission_count, created_at, poster_id')
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as unknown as ProblemQueryRow[]

  const posterIds = Array.from(new Set(rows.map(r => r.poster_id).filter(Boolean)))
  const posterNameById = new Map<string, string>()
  if (posterIds.length > 0) {
    const { data: posters } = await admin
      .from('users')
      .select('id, name')
      .in('id', posterIds)
    for (const u of (posters ?? []) as Array<{ id: string; name: string }>) {
      posterNameById.set(u.id, u.name)
    }
  }

  const problems: AdminProblemRow[] = rows.map(p => ({
    id: p.id,
    title: p.title,
    domain: p.domain,
    problem_type: p.problem_type,
    status: p.status,
    reward_amount: p.reward_amount ?? null,
    milestones: p.milestones,
    deadline: p.deadline,
    submission_count: p.submission_count ?? 0,
    created_at: p.created_at,
    poster_id: p.poster_id,
    poster_name: posterNameById.get(p.poster_id) ?? null,
  }))

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: 'rgba(148,163,184,0.8)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10
        }}>
          PROBLEMS · MODERATION
        </div>
        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 28,
          fontWeight: 950,
          color: 'var(--text-primary)',
          letterSpacing: '-0.6px',
          marginBottom: 8
        }}>
          Problems
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(226,232,240,0.78)', fontWeight: 500, maxWidth: 820 }}>
          View all problems and manage them (publish/hold, edit, delete, and check enrollments).
        </p>
      </div>

      <AdminProblemsList problems={problems} loadError={error?.message ?? null} />
    </div>
  )
}
