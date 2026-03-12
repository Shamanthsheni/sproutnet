import Link from 'next/link'

export default function AdminOverviewPage() {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10
        }}>
          ADMIN OVERVIEW
        </div>
        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 30,
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          marginBottom: 8
        }}>
          Control plane
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 720 }}>
          Moderate problems, keep the judging queue moving, and monitor platform health.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <ActionCard href="/admin/problems" label="Problems" meta="moderation" desc="Approve/hold, edit, delete, view enrollments." />
        <ActionCard href="/admin/judging" label="Judging" meta="queue" desc="Stage 2 pending submissions in the queue." />
        <ActionCard href="/admin/analytics" label="Analytics" meta="metrics" desc="Live counts and domain breakdown." />
      </div>
    </div>
  )
}

function ActionCard({ href, label, meta, desc }: { href: string; label: string; meta: string; desc: string }) {
  return (
    <Link href={href} className="admin-card" style={{ padding: '18px 18px', textDecoration: 'none', display: 'block' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 10
      }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
          {label}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em'
        }}>
          {meta}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.5 }}>
        {desc}
      </div>
      <div style={{ marginTop: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-primary)' }}>
        Open →
      </div>
    </Link>
  )
}
