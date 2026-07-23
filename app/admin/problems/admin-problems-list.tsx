'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

async function evaluateProblem(problemId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/problems/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem_id: problemId }),
    })
    if (res.ok) return { ok: true }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data.error ?? `Request failed (${res.status})` }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

export type AdminProblemRow = {
  id: string
  title: string
  domain: string
  problem_type: string
  status: string
  reward_amount: number | null
  milestones: number
  deadline: string
  submission_count: number
  created_at: string
  poster_id: string
  poster_name: string | null
}

export default function AdminProblemsList({ problems, loadError }: { problems: AdminProblemRow[]; loadError?: string | null }) {
  const [items, setItems] = useState(problems)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [evalBusyId, setEvalBusyId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'open'>('all')
  const [domainFilter, setDomainFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState<'all' | 'public_impact' | 'industry_challenge'>('all')
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  const domains = useMemo(() => {
    const set = new Set(items.map(p => p.domain).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (domainFilter !== 'All' && p.domain !== domainFilter) return false
      if (typeFilter !== 'all' && p.problem_type !== typeFilter) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        (p.poster_name ?? '').toLowerCase().includes(q) ||
        p.poster_id.toLowerCase().includes(q)
      )
    })
  }, [items, query, statusFilter, domainFilter, typeFilter])

  async function updateStatus(id: string, status: 'open' | 'pending') {
    setBusyId(id)
    try {
      const res = await fetch('/api/problems/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setItems(prev => prev.map(p => (p.id === id ? { ...p, status } : p)))
        return
      }
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
      alert(message)
    } finally {
      setBusyId(null)
    }
  }

  async function deleteProblem(id: string) {
    if (!confirm('Delete this problem? This cannot be undone.')) return
    setBusyId(id)
    try {
      const res = await fetch('/api/problems/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setItems(prev => prev.filter(p => p.id !== id))
        return
      }
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
      alert(message)
    } finally {
      setBusyId(null)
    }
  }

  if (loadError) {
    return (
      <div style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 16,
        padding: '16px 16px',
        color: '#FEE2E2'
      }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 900, marginBottom: 6 }}>
          Couldn’t load problems
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, opacity: 0.85 }}>
          {loadError}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="admin-surface" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
        <div style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 18,
          fontWeight: 900,
          color: 'var(--text-primary)',
          marginBottom: 8
        }}>
          No problems yet
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          If you already have problems, verify they exist in the `problems` table and that this environment points at the right Supabase project.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-primary)',
        borderRadius: 16,
        padding: '14px 14px',
        marginBottom: 16
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, domain, poster name, or poster id…"
            className="admin-input"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | 'pending' | 'open')}
            className="admin-select"
          >
            <option value="all">All statuses</option>
            <option value="open">Published (open)</option>
            <option value="pending">Held (pending)</option>
          </select>
          <select
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            className="admin-select"
          >
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'all' | 'public_impact' | 'industry_challenge')}
            className="admin-select"
          >
            <option value="all">All types</option>
            <option value="public_impact">Public Impact</option>
            <option value="industry_challenge">Industry Challenge</option>
          </select>
        </div>
        <div style={{ marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>Showing {filtered.length} of {items.length}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {seedResult && (
              <span style={{ fontSize: 11, color: seedResult.includes('error') ? '#F87171' : '#34D399' }}>
                {seedResult}
              </span>
            )}
            <button
              type="button"
              disabled={seeding}
              onClick={async () => {
                setSeeding(true)
                setSeedResult(null)
                try {
                  const res = await fetch('/api/problems/seed-test', { method: 'POST' })
                  const data = await res.json()
                  if (data.ok) {
                    const ok = data.results.filter((r: any) => r.success).length
                    const fail = data.results.filter((r: any) => !r.success).length
                    setSeedResult(`Seeded ${ok} problem${ok !== 1 ? 's' : ''}${fail ? `, ${fail} failed` : ''}`)
                    window.location.reload()
                  } else {
                    setSeedResult(`error: ${data.error ?? 'seed failed'}`)
                  }
                } catch {
                  setSeedResult('error: network failure')
                }
                setSeeding(false)
              }}
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
                color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 6,
                padding: '6px 14px', cursor: seeding ? 'not-allowed' : 'pointer',
                opacity: seeding ? 0.6 : 1,
              }}
            >
              {seeding ? 'Seeding...' : 'Seed Test Data'}
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-surface" style={{ textAlign: 'center', padding: '70px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔎</div>
          <div style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 18,
            fontWeight: 900,
            color: 'var(--text-primary)',
            marginBottom: 8
          }}>
            No matches
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Try clearing filters or changing the search query.
          </div>
        </div>
      ) : (
        <div className="admin-table">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 180px 160px 130px 120px 110px 360px',
            minWidth: 980,
            gap: 10,
            padding: '12px 14px',
            background: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            {['Title', 'Poster', 'Domain', 'Type', 'Status', 'Deadline', 'Actions'].map(h => (
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
            {filtered.map(problem => {
              const isOpen = problem.status === 'open'
              const isPending = problem.status === 'pending'
              const canToggle = isOpen || isPending
              const isBusy = busyId === problem.id
              const deadline = new Date(problem.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              const posterLabel = problem.poster_name ? `${problem.poster_name}` : `${problem.poster_id.slice(0, 8)}…`
              const typeLabel = problem.problem_type === 'industry_challenge' ? 'Industry' : 'Public'

              return (
                <div key={problem.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 180px 160px 130px 120px 110px 360px',
                  minWidth: 980,
                  gap: 10,
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-primary)',
                  alignItems: 'center'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {problem.title}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(148,163,184,0.8)', marginTop: 3 }}>
                      {problem.submission_count} sub · {problem.id.slice(0, 8)}…
                    </div>
                  </div>

                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {posterLabel}
                  </div>

                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {problem.domain}
                  </div>

                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                    {typeLabel}
                  </div>

                  <div>
                    <span className={`admin-pill ${isOpen ? 'admin-pill--accent' : 'admin-pill--warning'}`}>
                      {problem.status}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(226,232,240,0.85)' }}>
                    {deadline}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                    <Link href={`/problems/${problem.id}`} className="admin-btn admin-linkbtn">
                      View
                    </Link>
                    <Link href={`/admin/problems/${problem.id}/enrollments`} className="admin-btn admin-linkbtn">
                      Enrollments
                    </Link>
                    <Link href={`/admin/problems/${problem.id}/edit`} className="admin-btn admin-linkbtn">
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={isBusy || !canToggle}
                      onClick={() => updateStatus(problem.id, isOpen ? 'pending' : 'open')}
                      className={`admin-btn ${isOpen ? 'admin-btn--warning' : 'admin-btn--primary'}`}
                    >
                      {isOpen ? 'Hold' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      disabled={evalBusyId === problem.id}
                      onClick={async () => {
                        setEvalBusyId(problem.id)
                        const result = await evaluateProblem(problem.id)
                        if (result.ok) {
                          window.location.reload()
                        } else {
                          alert(result.error ?? 'Re-evaluation failed')
                        }
                        setEvalBusyId(null)
                      }}
                      style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
                        color: '#2D6A4F', background: '#EAF4EE', border: '1px solid rgba(45,106,79,0.2)',
                        borderRadius: 6, padding: '4px 10px', cursor: evalBusyId === problem.id ? 'not-allowed' : 'pointer',
                        opacity: evalBusyId === problem.id ? 0.6 : 1,
                      }}
                    >
                      {evalBusyId === problem.id ? '...' : 'Re-evaluate'}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => deleteProblem(problem.id)}
                      className="admin-btn admin-btn--danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
