import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminEditProblemForm from './admin-edit-problem-form'

type ProblemRow = {
  id: string
  title: string
  domain: string
  problem_type: string
  reward_amount: number | null
  milestones: number
  deadline: string
  judging_deadline: string
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
  status: string
}

export default async function AdminEditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: problem } = await admin
    .from('problems')
    .select('id, title, domain, problem_type, reward_amount, milestones, deadline, judging_deadline, context, problem_stmt, scope, constraints, deliverables, status')
    .eq('id', id)
    .single()

  if (!problem) redirect('/admin/problems')
  const row = problem as unknown as ProblemRow

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'rgba(148,163,184,0.8)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 10
          }}>
            PROBLEM · EDIT
          </div>
          <h1 style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 'clamp(20px, 4vw, 26px)',
            fontWeight: 950,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Edit problem
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(226,232,240,0.78)', fontWeight: 500 }}>
            Update the problem statement and deadlines.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href={`/problems/${id}`} style={{
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
            View public
          </Link>
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
            ← Back
          </Link>
        </div>
      </div>

      <AdminEditProblemForm problem={row} />
    </div>
  )
}
