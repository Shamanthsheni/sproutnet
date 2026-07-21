import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

type SubmissionRow = {
  id: string
  stage: string
  milestone: number
  status: string
  created_at: string
  problem_id: string
  student_id: string
  problem_title: string | null
  problem_domain: string | null
  student_name: string | null
  student_dept: string | null
  student_year: string | null
}

export default async function AdminJudgingPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('submissions')
    .select('id, stage, milestone, status, created_at, problem_id, student_id')
    .eq('stage', 'full')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []) as Array<{
    id: string
    stage: string
    milestone: number
    status: string
    created_at: string
    problem_id: string
    student_id: string
  }>

  const problemIds = Array.from(new Set(rows.map(r => r.problem_id).filter(Boolean)))
  const studentIds = Array.from(new Set(rows.map(r => r.student_id).filter(Boolean)))

  const problemById = new Map<string, { title: string | null; domain: string | null }>()
  if (problemIds.length > 0) {
    const { data: probs } = await admin
      .from('problems')
      .select('id, title, domain')
      .in('id', problemIds)
    for (const p of (probs ?? []) as Array<{ id: string; title: string | null; domain: string | null }>) {
      problemById.set(p.id, { title: p.title ?? null, domain: p.domain ?? null })
    }
  }

  const studentById = new Map<string, { name: string | null; dept: string | null; year: string | null }>()
  if (studentIds.length > 0) {
    const { data: users } = await admin
      .from('users')
      .select('id, name, dept, year')
      .in('id', studentIds)
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; dept: string | null; year: string | null }>) {
      studentById.set(u.id, { name: u.name ?? null, dept: u.dept ?? null, year: u.year ?? null })
    }
  }

  const submissions: SubmissionRow[] = rows.map(r => {
    const p = problemById.get(r.problem_id)
    const s = studentById.get(r.student_id)
    return {
      ...r,
      problem_title: p?.title ?? null,
      problem_domain: p?.domain ?? null,
      student_name: s?.name ?? null,
      student_dept: s?.dept ?? null,
      student_year: s?.year ?? null,
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
          JUDGING · QUEUE
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
          Submissions waiting in the blind judging queue. Showing latest 200.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          background: 'var(--bg-surface)',
          borderRadius: 18,
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚖️</div>
          <div style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 18,
            fontWeight: 900,
            color: 'var(--text-primary)',
            marginBottom: 8
          }}>
            No pending submissions
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            When students submit solutions, they will appear here.
          </div>
        </div>
      ) : (
        <div className="admin-table">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 160px 130px 170px 180px',
            minWidth: 800,
            gap: 10,
            padding: '12px 14px',
            background: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            {['Problem', 'Domain', 'Submitted', 'Student', 'Actions'].map(h => (
              <div key={h} style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em'
              }}>
                {h}
              </div>
            ))}
          </div>

          <div style={{ maxHeight: 680, overflowY: 'auto' }}>
            {submissions.map(sub => {
              const submitted = new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              const studentLabel = sub.student_name ?? `Student ${sub.student_id.slice(0, 6)}…`
              return (
                <div key={sub.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 160px 130px 170px 180px',
                  minWidth: 800,
                  gap: 10,
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-primary)',
                  alignItems: 'center'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.problem_title ?? 'Problem'}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                      {sub.id.slice(0, 8)}… · status={sub.status}
                    </div>
                  </div>

                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.problem_domain ?? '—'}
                  </div>

                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(226,232,240,0.85)' }}>
                    {submitted}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(226,232,240,0.9)', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {studentLabel}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                      {(sub.student_dept ?? '—')} · {(sub.student_year ?? '—')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link href={`/problems/${sub.problem_id}`} className="admin-btn admin-linkbtn">
                      View problem
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{
        marginTop: 18,
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 12,
        color: 'var(--text-muted)'
      }}>
        Scoring UI can be added once the submissions scoring fields are finalized in Supabase.
      </div>
    </div>
  )
}
