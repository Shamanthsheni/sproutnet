'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseProgressUploads } from '@/lib/problem-progress'
import { parseDeliverables, type DeliverableItem } from '@/lib/deliverables'

export type JudgingRow = {
  id: string
  status: string
  participantType: 'team' | 'individual'
  deliverables: unknown[]
  fields: Record<string, string>
  submittedAt: string
  problemTitle: string
  problemDomain: string | null
  problemId: string
  studentName: string
  studentDept: string | null
  studentYear: string | null
}

const FIELD_LABELS: Array<[string, string]> = [
  ['f_understanding', 'Problem Understanding'],
  ['f_solution', 'Proposed Solution'],
  ['f_impact', 'Expected Impact'],
  ['f_rootcause', 'Root Cause Analysis'],
  ['f_feasibility', 'Feasibility Assessment'],
  ['f_risks', 'Risks & Limitations'],
  ['f_implementation', 'Implementation Plan'],
]

export default function JudgingQueue({ rows }: { rows: JudgingRow[] }) {
  if (rows.length === 0) {
    return (
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
          The queue is clear
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          New Stage-1 submissions will appear here for review.
        </div>
      </div>
    )
  }

  return (
    <div className="admin-table">
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 1.6fr) 120px 110px 140px 100px',
        minWidth: 860,
        gap: 10,
        padding: '12px 14px',
        background: 'var(--bg-hover)',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        {['Problem / Student', 'Domain', 'Entry', 'Submitted', 'Action'].map(h => (
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

      <div style={{ overflowY: 'auto' }}>
        {rows.map(row => (
          <JudgingRowItem key={row.id} row={row} />
        ))}
      </div>
    </div>
  )
}

function JudgingRowItem({ row }: { row: JudgingRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(7)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')

  const progressFiles = parseProgressUploads(row.fields.f_implementation).files
  const deliverables = parseDeliverables(row.deliverables)
  const submitted = new Date(row.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const answered = FIELD_LABELS.filter(([k]) => (row.fields[k] ?? '').trim().length > 0).length

  async function judge(decision: 'approve' | 'reject') {
    setSaving(decision)
    setError('')
    try {
      const res = await fetch('/api/submissions/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: row.id,
          score,
          feedback: feedback || undefined,
          decision,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? `Failed to ${decision} (${res.status}).`)
        setSaving(null)
        return
      }
      setOpen(false)
      setSaving(null)
      router.refresh()
    } catch {
      setError('Network error. Try again.')
      setSaving(null)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-primary)' }}>
      {/* Summary row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.6fr) 120px 110px 140px 100px',
          minWidth: 860,
          gap: 10,
          padding: '13px 14px',
          alignItems: 'center',
          cursor: 'pointer',
          background: open ? 'var(--bg-hover)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.problemTitle}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {row.studentName}{row.studentDept ? ` · ${row.studentDept}` : ''}{row.studentYear ? ` · ${row.studentYear}` : ''}
          </div>
        </div>

        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 800, color: 'rgba(226,232,240,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.problemDomain ?? '—'}
        </div>

        <span style={{
          display: 'inline-block',
          justifySelf: 'start',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.08em',
          padding: '4px 9px',
          borderRadius: 999,
          background: row.participantType === 'team' ? 'rgba(96,165,250,0.12)' : 'rgba(45,212,191,0.12)',
          border: row.participantType === 'team' ? '1px solid rgba(96,165,250,0.35)' : '1px solid rgba(45,212,191,0.35)',
          color: row.participantType === 'team' ? '#60A5FA' : '#2DD4BF',
          textTransform: 'uppercase',
        }}>
          {row.participantType === 'team' ? '👥 Team' : 'Indiv.'}
        </span>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-secondary)', opacity: 0.75 }}>
          {submitted}
        </div>

        <button
          type="button"
          className="admin-btn"
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          style={{ fontSize: 11 }}
        >
          {open ? 'Close' : 'Review'}
        </button>
      </div>

      {/* Review panel */}
      {open && (
        <div style={{
          background: 'var(--bg-surface)',
          padding: '18px 16px 22px',
          display: 'grid',
          gap: 18,
        }}>
          {/* Judge panel */}
          <div style={{
            border: '1px solid rgba(180,83,9,0.35)',
            background: '#FFFBEB',
            borderRadius: 14,
            padding: 16,
            display: 'grid',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Judge this submission
              </span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
                {answered}/7 sections answered · {deliverables.length} final items · {progressFiles.length} attached files
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Score
                </span>
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 900 }}>
                  {score}<span style={{ fontSize: 13, opacity: 0.5 }}> / 10</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: `2px solid ${score === n ? '#B45309' : 'var(--border-input)'}`,
                      background: score === n ? '#FEF3C7' : '#FFFFFF',
                      boxShadow: score === n ? '0 0 0 3px rgba(180,83,9,0.12)' : 'none',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Feedback for the builder (optional) — shown with the result…"
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#FFFFFF', border: '1px solid var(--border-input)',
                borderRadius: 10, padding: '10px 12px',
                fontSize: 13, color: '#111827', resize: 'vertical',
                fontFamily: 'DM Sans, sans-serif', outline: 'none',
              }}
            />

            {error && (
              <div style={{ fontSize: 12, color: '#F87171', fontFamily: 'JetBrains Mono, monospace' }}>{error}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => judge('reject')}
                disabled={saving !== null}
                style={{
                  padding: '11px 0',
                  background: saving === 'reject' ? '#FEE2E2' : '#FFFFFF',
                  border: `2px solid ${saving === 'reject' ? '#DC2626' : 'rgba(220,38,38,0.45)'}`, borderRadius: 10,
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14, fontWeight: 800, cursor: saving !== null ? 'not-allowed' : 'pointer',
                }}
              >
                {saving === 'reject' ? 'Rejecting…' : '✗ Reject'}
              </button>
              <button
                type="button"
                onClick={() => judge('approve')}
                disabled={saving !== null}
                style={{
                  padding: '11px 0',
                  background: saving === 'approve' ? '#DCFCE7' : '#FFFFFF',
                  border: `2px solid ${saving === 'approve' ? '#16A34A' : 'rgba(22,163,74,0.45)'}`, borderRadius: 10,
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14, fontWeight: 800, cursor: saving !== null ? 'not-allowed' : 'pointer',
                }}
              >
                {saving === 'approve' ? 'Approving…' : '✓ Approve'}
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>
              APPROVAL UNLOCKS THE STUDENT&apos;S STAGE-2 FINAL UPLOAD · SCORE FEEDS THE LEADERBOARD
            </div>
          </div>

          {/* Deliverables preview */}
          {deliverables.length > 0 && (
            <Section title={`Final deliverables (${deliverables.length})`}>
              <div style={{ display: 'grid', gap: 8 }}>
                {deliverables.map((item: DeliverableItem, i: number) => (
                  <a key={`${item.url}-${i}`} href={item.url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid var(--border-primary)', textDecoration: 'none',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--accent-primary)' }}>
                      {item.kind === 'link' ? 'LINK' : 'FILE'}
                    </span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i + 1}. {item.label}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>open ↗</span>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Attached files */}
          {progressFiles.length > 0 && (
            <Section title={`Attached files (${progressFiles.length})`}>
              <div style={{ display: 'grid', gap: 8 }}>
                {progressFiles.map(f => (
                  <a key={f.url} href={f.url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid var(--border-primary)', textDecoration: 'none',
                  }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      📎 {f.name}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>download ↗</span>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Written solution */}
          <Section title="Written solution">
            <div style={{ display: 'grid', gap: 12 }}>
              {FIELD_LABELS.map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                    {label}
                  </div>
                  {row.fields[key]?.trim() ? (
                    <div
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.65, color: 'rgba(226,232,240,0.88)' }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.fields[key]) }}
                    />
                  ) : (
                    <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)' }}>Not answered.</div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Link href={`/problems/${row.problemId}`} className="admin-btn admin-linkbtn" style={{ fontSize: 12, textDecoration: 'none', justifySelf: 'start' }}>
            View problem page ↗
          </Link>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}
