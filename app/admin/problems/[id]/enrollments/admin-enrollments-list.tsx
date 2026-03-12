'use client'

import { useMemo, useState } from 'react'

export type AdminEnrollmentRow = {
  id: string
  created_at: string
  student_id: string
  status?: string
  student_name: string | null
  student_dept: string | null
  student_year: string | null
}

export default function AdminEnrollmentsList({ enrollments, problemId }: { enrollments: AdminEnrollmentRow[]; problemId: string }) {
  const [items, setItems] = useState(enrollments)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(e =>
      (e.student_name ?? '').toLowerCase().includes(q) ||
      (e.student_dept ?? '').toLowerCase().includes(q) ||
      (e.student_year ?? '').toLowerCase().includes(q) ||
      e.student_id.toLowerCase().includes(q)
    )
  }, [items, query])

  async function removeEnrollment(id: string) {
    if (!confirm('Remove this student? They will not be able to submit.')) return
    setBusyId(id)
    try {
      const res = await fetch('/api/enrollments/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: id, problem_id: problemId }),
      })
      if (res.ok) {
        setItems(prev => prev.filter(e => e.id !== id))
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

  if (items.length === 0) {
    return (
      <div className="admin-surface" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
          No active enrollments
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Students will appear here after they enroll.
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
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search students…"
          className="admin-input"
        />
        <div style={{ marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {items.length}
        </div>
      </div>

      <div className="admin-table">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 160px 160px 150px 220px',
          gap: 10,
          padding: '12px 14px',
          background: 'var(--bg-hover)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          {['Student', 'Dept', 'Year', 'Enrolled', 'Actions'].map(h => (
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
          {filtered.map(e => (
            <div key={e.id} style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 160px 160px 150px 220px',
              gap: 10,
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-primary)',
              alignItems: 'center'
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.student_name ?? `Student ${e.student_id.slice(0, 6)}…`}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(148,163,184,0.8)', marginTop: 3 }}>
                  {e.student_id.slice(0, 8)}…
                </div>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.student_dept ?? '—'}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.student_year ?? '—'}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(226,232,240,0.85)' }}>
                {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={busyId === e.id}
                  onClick={() => removeEnrollment(e.id)}
                  className="admin-btn admin-btn--danger"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
