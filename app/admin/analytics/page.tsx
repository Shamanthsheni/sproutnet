import { createAdminClient } from '@/lib/supabase/admin'

type DomainCount = { domain: string; count: number }

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient()

  const [
    totalProblemsRes,
    openProblemsRes,
    pendingProblemsRes,
    totalUsersRes,
    studentsRes,
    postersRes,
    adminsRes,
    enrollmentsRes,
    submissionsRes,
  ] = await Promise.all([
    admin.from('problems').select('id', { count: 'exact', head: true }),
    admin.from('problems').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('problems').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'poster'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    admin.from('enrollments').select('id', { count: 'exact', head: true }),
    admin.from('submissions').select('id', { count: 'exact', head: true }),
  ])

  const totalProblems = totalProblemsRes.count ?? 0
  const openProblems = openProblemsRes.count ?? 0
  const pendingProblems = pendingProblemsRes.count ?? 0

  const totalUsers = totalUsersRes.count ?? 0
  const students = studentsRes.count ?? 0
  const posters = postersRes.count ?? 0
  const admins = adminsRes.count ?? 0

  const totalEnrollments = enrollmentsRes.count ?? 0
  const totalSubmissions = submissionsRes.count ?? 0

  const { data: openProblemDomains } = await admin
    .from('problems')
    .select('domain')
    .eq('status', 'open')

  const domainCountsMap = new Map<string, number>()
  for (const row of (openProblemDomains ?? []) as Array<{ domain: string }>) {
    const d = row.domain ?? 'Unknown'
    domainCountsMap.set(d, (domainCountsMap.get(d) ?? 0) + 1)
  }
  const domainCounts: DomainCount[] = Array.from(domainCountsMap.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)

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
          ANALYTICS · METRICS
        </div>
        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 28,
          fontWeight: 950,
          color: 'var(--text-primary)',
          letterSpacing: '-0.6px',
          marginBottom: 8
        }}>
          Analytics
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(226,232,240,0.78)', fontWeight: 500 }}>
          Quick platform stats. (Counts are pulled live from Supabase.)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <StatCard label="Problems" value={totalProblems} accent="#1C1410" />
        <StatCard label="Open" value={openProblems} accent="#15803d" />
        <StatCard label="Pending" value={pendingProblems} accent="#92400e" />
        <StatCard label="Users" value={totalUsers} accent="#2D6A4F" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Students" value={students} accent="#2D6A4F" />
        <StatCard label="Posters" value={posters} accent="#F4A723" />
        <StatCard label="Admins" value={admins} accent="#1E40AF" />
        <StatCard label="Enrollments" value={totalEnrollments} accent="#1C1410" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Submissions" value={totalSubmissions} accent="#1C1410" />
        <StatCard label="Avg enrollments/problem" value={totalProblems > 0 ? (totalEnrollments / totalProblems).toFixed(1) : '—'} accent="#2D6A4F" />
        <StatCard label="Avg submissions/problem" value={totalProblems > 0 ? (totalSubmissions / totalProblems).toFixed(1) : '—'} accent="#F4A723" />
      </div>

      <div className="admin-table">
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-hover)'
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Open problems by domain
          </div>
        </div>

        {domainCounts.length === 0 ? (
          <div style={{ padding: '18px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>
            No open problems.
          </div>
        ) : (
          <div>
            {domainCounts.map((d, idx) => (
              <div key={d.domain} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                borderBottom: idx < domainCounts.length - 1 ? '1px solid var(--border-primary)' : 'none'
              }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-primary)', fontWeight: 900 }}>
                  {d.domain}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--accent-primary)' }}>
                  {d.count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-primary)',
      borderRadius: 16,
      padding: '16px',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 24,
        fontWeight: 700,
        color: accent,
        marginBottom: 6
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </div>
    </div>
  )
}
