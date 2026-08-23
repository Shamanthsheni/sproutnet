'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { parseProgressUploads } from '@/lib/problem-progress'
import { parseDeliverables, type DeliverableItem } from '@/lib/deliverables'

export type AdminSolutionRow = {
  id: string
  status: string
  score: number | null
  participantType: 'team' | 'individual'
  deliverables: unknown[]
  fields: Record<string, string>
  createdAt: string
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

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: 'rgba(248,180,44,0.1)', border: 'rgba(248,180,44,0.3)', text: '#FBBF24' },
  approved: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34D399' },
  rejected: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#F87171' },
  draft: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', text: '#94A3B8' },
}

export default function AdminSolutionsList({ solutions }: { solutions: AdminSolutionRow[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return solutions.filter(s => {
      const deliverableCount = parseDeliverables(s.deliverables).length
      if (statusFilter === 'final') {
        if (deliverableCount === 0) return false
      } else if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false
      }
      if (!q) return true
      return (
        s.problemTitle.toLowerCase().includes(q) ||
        s.studentName.toLowerCase().includes(q) ||
        (s.problemDomain ?? '').toLowerCase().includes(q)
      )
    })
  }, [solutions, query, statusFilter])

  if (solutions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '80px 24px',
        background: 'var(--bg-surface)',
        borderRadius: 18,
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
        <div style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 18,
          fontWeight: 900,
          color: 'var(--text-primary)',
          marginBottom: 8
        }}>
          No solutions uploaded yet
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Full student submissions will appear here once submitted.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by problem, student, or domain…"
          style={{
            flex: '1 1 260px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--text-primary)',
            background: '#1A1A1A',
            border: '1px solid var(--border-input)',
            borderRadius: 10,
            padding: '10px 14px',
            outline: 'none'
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            background: '#1A1A1A',
            border: '1px solid var(--border-input)',
            borderRadius: 10,
            padding: '10px 14px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
          <option value="final">📦 With final work</option>
        </select>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
          {filtered.length} of {solutions.length}
        </span>
      </div>

      {/* Table header */}
      <div className="admin-table">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.5fr) 120px 110px 140px 90px 90px 100px',
          minWidth: 980,
          gap: 10,
          padding: '12px 14px',
          background: 'var(--bg-hover)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          {['Problem / Student', 'Domain', 'Entry', 'Submitted', 'Status', 'Final work', 'Actions'].map(h => (
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

        <div style={{ maxHeight: 720, overflowY: 'auto' }}>
          {filtered.map(sub => {
            const expanded = expandedId === sub.id
            const progressFiles = parseProgressUploads(sub.fields.f_implementation).files
            const deliverables = parseDeliverables(sub.deliverables)
            const statusColor = STATUS_COLORS[sub.status] ?? STATUS_COLORS.draft
            const submitted = new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

            return (
              <div key={sub.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {/* Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 1.5fr) 120px 110px 140px 90px 90px 100px',
                  minWidth: 980,
                  gap: 10,
                  padding: '12px 14px',
                  alignItems: 'center',
                  background: expanded ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedId(expanded ? null : sub.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.problemTitle}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.studentName}{sub.studentDept ? ` · ${sub.studentDept}` : ''}{sub.studentYear ? ` · ${sub.studentYear}` : ''}
                    </div>
                  </div>

                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.problemDomain ?? '—'}
                  </div>

                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      padding: '4px 9px',
                      borderRadius: 999,
                      background: sub.participantType === 'team' ? 'rgba(96,165,250,0.12)' : 'rgba(45,212,191,0.12)',
                      border: sub.participantType === 'team' ? '1px solid rgba(96,165,250,0.35)' : '1px solid rgba(45,212,191,0.35)',
                      color: sub.participantType === 'team' ? '#60A5FA' : '#2DD4BF',
                      textTransform: 'uppercase'
                    }}>
                      {sub.participantType === 'team' ? '👥 Team' : 'Individual'}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(226,232,240,0.85)' }}>
                    {submitted}
                  </div>

                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      padding: '4px 9px',
                      borderRadius: 999,
                      background: statusColor.bg,
                      border: `1px solid ${statusColor.border}`,
                      color: statusColor.text,
                      textTransform: 'uppercase'
                    }}>
                      {sub.status}{sub.score != null ? ` · ${sub.score}` : ''}
                    </span>
                  </div>

                  <div>
                    {deliverables.length > 0 ? (
                      <span style={{
                        display: 'inline-block',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        padding: '4px 9px',
                        borderRadius: 999,
                        background: 'rgba(96,165,250,0.12)',
                        border: '1px solid rgba(96,165,250,0.35)',
                        color: '#60A5FA',
                      }}>
                        📦 {deliverables.length}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button type="button" className="admin-btn admin-linkbtn" style={{ fontSize: 11 }} onClick={e => { e.stopPropagation(); setExpandedId(expanded ? null : sub.id) }}>
                      {expanded ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div style={{
                    padding: '18px 16px 22px',
                    background: 'var(--bg-surface)',
                    display: 'grid',
                    gap: 16
                  }}>
                    {/* Deliverables */}
                    <Section title={`Final deliverables (${deliverables.length})`}>
                      {deliverables.length === 0 ? (
                        <Empty>None added.</Empty>
                      ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {deliverables.map((item: DeliverableItem, i: number) => (
                            <a key={`${item.url}-${i}`} href={item.url} target="_blank" rel="noreferrer" style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '9px 12px',
                              borderRadius: 8,
                              border: '1px solid var(--border-primary)',
                              textDecoration: 'none',
                              minWidth: 0
                            }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--accent-primary)' }}>
                                {item.kind === 'link' ? 'LINK' : 'FILE'}
                              </span>
                              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {i + 1}. {item.label}
                              </span>
                              <span style={{ marginLeft: 'auto', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
                                open ↗
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </Section>

                    {/* Attached progress files */}
                    <Section title={`Attached files (${progressFiles.length})`}>
                      {progressFiles.length === 0 ? (
                        <Empty>No supporting files attached.</Empty>
                      ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {progressFiles.map(f => (
                            <a key={f.url} href={f.url} target="_blank" rel="noreferrer" style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '9px 12px',
                              borderRadius: 8,
                              border: '1px solid var(--border-primary)',
                              textDecoration: 'none'
                            }}>
                              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                📎 {f.name}
                              </span>
                              <span style={{ marginLeft: 'auto', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
                                download ↗
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </Section>

                    {/* Written solution */}
                    <Section title="Written solution">
                      <div style={{ display: 'grid', gap: 12 }}>
                        {FIELD_LABELS.map(([key, label]) => (
                          <div key={key}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                              {label}
                            </div>
                            {sub.fields[key] ? (
                              <div style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: 13,
                                lineHeight: 1.65,
                                color: 'rgba(226,232,240,0.88)'
                              }}
                              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(sub.fields[key]) }}
                              />
                            ) : (
                              <Empty>Not answered.</Empty>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Link href={`/problems/${sub.problemId}`} className="admin-btn admin-linkbtn" style={{ fontSize: 12, textDecoration: 'none' }}>
                        View problem page ↗
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-primary)',
          borderRadius: 14,
          marginTop: 12
        }}>
          No solutions match your filters.
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)' }}>
      {children}
    </div>
  )
}

// Submissions store rich-text HTML from students. Strip scripts/event handlers
// before rendering with dangerouslySetInnerHTML.
function sanitizeHtmlForDisplay(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}
