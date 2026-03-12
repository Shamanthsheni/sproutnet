import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminEnrollmentsList, { type AdminEnrollmentRow } from './admin-enrollments-list'

type EnrollmentRow = {
  id: string
  created_at: string
  student_id: string
  status?: string
}

export default async function AdminProblemEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: problem } = await admin
    .from('problems')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!problem) redirect('/admin/problems')

  const { data: enrollments } = await admin
    .from('enrollments')
    .select('id, created_at, student_id, status')
    .eq('problem_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const rows = (enrollments ?? []) as unknown as EnrollmentRow[]
  const studentIds = Array.from(new Set(rows.map(r => r.student_id).filter(Boolean)))
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

  const viewRows: AdminEnrollmentRow[] = rows.map(r => {
    const s = studentById.get(r.student_id)
    return {
      id: r.id,
      created_at: r.created_at,
      student_id: r.student_id,
      status: r.status,
      student_name: s?.name ?? null,
      student_dept: s?.dept ?? null,
      student_year: s?.year ?? null,
    }
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'rgba(148,163,184,0.8)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 10
          }}>
            PROBLEM · ENROLLMENTS
          </div>
          <h1 style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 26,
            fontWeight: 950,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Enrollments
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(226,232,240,0.78)', fontWeight: 500 }}>
            {problem.title}
          </p>
        </div>
        <Link href="/admin/problems" style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          fontWeight: 900,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 12,
          padding: '9px 12px',
          background: 'rgba(148,163,184,0.08)'
        }}>
          ← Back to Problems
        </Link>
      </div>

      <AdminEnrollmentsList enrollments={viewRows} problemId={id} />
    </div>
  )
}
