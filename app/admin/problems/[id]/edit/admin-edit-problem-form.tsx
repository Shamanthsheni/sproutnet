'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const DOMAINS = [
  'AI & Data',
  'Climate',
  'Public Infrastructure',
  'Healthcare',
  'Agriculture',
  'Education',
  'Urban Mobility',
  'Civic Technology',
]

const PROBLEM_TYPES = [
  { value: 'public_impact', label: 'Public Impact' },
  { value: 'industry_challenge', label: 'Industry Challenge' },
]

type Problem = {
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

export default function AdminEditProblemForm({ problem }: { problem: Problem }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [title, setTitle] = useState(problem.title)
  const [domain, setDomain] = useState(problem.domain)
  const [problemType, setProblemType] = useState(problem.problem_type)
  const [rewardAmount, setRewardAmount] = useState(problem.reward_amount ? String(problem.reward_amount) : '')
  const [milestones, setMilestones] = useState(String(problem.milestones))
  const [deadline, setDeadline] = useState(problem.deadline)
  const [judgingDeadline, setJudgingDeadline] = useState(problem.judging_deadline)
  const [context, setContext] = useState(problem.context)
  const [problemStmt, setProblemStmt] = useState(problem.problem_stmt)
  const [scope, setScope] = useState(problem.scope)
  const [constraints, setConstraints] = useState(problem.constraints)
  const [deliverables, setDeliverables] = useState(problem.deliverables)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (judgingDeadline && deadline && judgingDeadline < deadline) {
      setError('Judging deadline must be on or after the submission deadline.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    const payload = {
      id: problem.id,
      title: title.trim(),
      domain,
      problem_type: problemType,
      reward_amount: problemType === 'industry_challenge' && rewardAmount ? Number(rewardAmount) : null,
      milestones: Number(milestones),
      deadline,
      judging_deadline: judgingDeadline,
      context: context.trim(),
      problem_stmt: problemStmt.trim(),
      scope: scope.trim(),
      constraints: constraints.trim(),
      deliverables: deliverables.trim(),
    }

    const res = await fetch('/api/problems/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = `Request failed (${res.status}).`
      if (text) {
        try {
          const data = JSON.parse(text)
          message = data?.error ?? message
        } catch {
          message = text
        }
      }
      if (message.includes('min_deadline')) {
        message = 'Submission deadline is too soon. Please choose a later date.'
      }
      setError(message)
      setLoading(false)
      return
    }

    setSuccess('Problem updated.')
    setLoading(false)
    setTimeout(() => {
      router.push('/admin/problems')
      router.refresh()
    }, 800)
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-primary)',
      borderRadius: 18,
      padding: '18px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--accent-primary)',
            background: 'rgba(16,163,127,0.12)',
            border: '1px solid rgba(16,163,127,0.28)',
            padding: '4px 10px',
            borderRadius: 999
          }}>
            Status: {problem.status}
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'rgba(148,163,184,0.85)',
            background: 'rgba(148,163,184,0.08)',
            border: '1px solid rgba(148,163,184,0.14)',
            padding: '4px 10px',
            borderRadius: 999
          }}>
            ID: {problem.id.slice(0, 8)}…
          </span>
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
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#DC2626'
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#16A34A'
          }}>
            {success}
          </div>
        )}

        <Field label="Problem title">
          <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Field label="Domain">
            <select value={domain} onChange={e => setDomain(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Problem type">
            <select value={problemType} onChange={e => setProblemType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {PROBLEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        {problemType === 'industry_challenge' && (
          <Field label="Reward amount (INR)">
            <input type="number" min="0" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} style={inputStyle} />
          </Field>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Milestones">
            <input type="number" min="1" max="7" value={milestones} onChange={e => setMilestones(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Submission deadline">
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required style={inputStyle} />
          </Field>
          <Field label="Judging deadline">
            <input type="date" value={judgingDeadline} onChange={e => setJudgingDeadline(e.target.value)} required style={inputStyle} />
          </Field>
        </div>

        <Field label="Background & context">
          <textarea value={context} onChange={e => setContext(e.target.value)} required rows={4} style={textAreaStyle} />
        </Field>

        <Field label="Problem statement">
          <textarea value={problemStmt} onChange={e => setProblemStmt(e.target.value)} required rows={4} style={textAreaStyle} />
        </Field>

        <Field label="Scope">
          <textarea value={scope} onChange={e => setScope(e.target.value)} required rows={3} style={textAreaStyle} />
        </Field>

        <Field label="Constraints">
          <textarea value={constraints} onChange={e => setConstraints(e.target.value)} required rows={3} style={textAreaStyle} />
        </Field>

        <Field label="Deliverables">
          <textarea value={deliverables} onChange={e => setDeliverables(e.target.value)} required rows={3} style={textAreaStyle} />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading} style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#1C1410',
            background: loading ? '#F9C05A' : '#F4A723',
            border: 'none',
            borderRadius: 10,
            padding: '12px 18px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 10px rgba(244,167,35,0.3)'
          }}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 800, color: 'rgba(226,232,240,0.9)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  color: 'var(--text-primary)',
  background: '#1A1A1A',
  border: '1px solid var(--border-input)',
  borderRadius: 10,
  padding: '11px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
}
