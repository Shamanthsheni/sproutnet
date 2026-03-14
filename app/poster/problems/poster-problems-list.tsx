'use client'

import Link from 'next/link'
import { useState } from 'react'

export type ProblemRow = {
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
}

export default function PosterProblemsList({ problems }: { problems: ProblemRow[] }) {
  const [items, setItems] = useState(problems)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function updateStatus(id: string, status: ProblemRow['status']) {
    setBusyId(id)
    const res = await fetch('/api/problems/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setItems(prev => prev.map(p => (p.id === id ? { ...p, status } : p)))
    }
    setBusyId(null)
  }

  async function deleteProblem(id: string) {
    if (!confirm('Delete this problem? This cannot be undone.')) return
    setBusyId(id)
    const res = await fetch('/api/problems/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setItems(prev => prev.filter(p => p.id !== id))
    }
    setBusyId(null)
  }

  if (items.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 24px',
        background: '#fff', borderRadius: 12,
        border: '1.5px solid rgba(28,20,16,0.07)'
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🗂️</div>
        <div style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 18, fontWeight: 600,
          color: '#1C1410', marginBottom: 8
        }}>
          No problems yet
        </div>
        <div style={{ fontSize: 14, color: '#9CA3A0' }}>
          Post your first problem to see it here.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {items.map(problem => {
        const isOpen = problem.status === 'open'
        const isBusy = busyId === problem.id
        const deadline = new Date(problem.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        return (
          <div key={problem.id} style={{
            background: '#fff',
            border: '1.5px solid rgba(28,20,16,0.06)',
            borderRadius: 14,
            padding: '18px 20px',
            boxShadow: '0 8px 30px rgba(28,20,16,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  color: '#2D6A4F', background: '#EAF4EE',
                  padding: '4px 10px', borderRadius: 999
                }}>
                  {problem.domain}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  color: isOpen ? '#15803d' : '#92400e',
                  background: isOpen ? 'rgba(21,128,61,0.12)' : 'rgba(146,64,14,0.12)',
                  padding: '4px 10px', borderRadius: 999,
                  textTransform: 'capitalize'
                }}>
                  {problem.status}
                </span>
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 650, color: '#0f0a08' }}>
                {problem.title}
              </div>
              <div style={{ fontSize: 13, color: '#4A3F38', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>{problem.problem_type === 'industry_challenge' ? 'Industry Challenge' : 'Public Impact'}</span>
                <span>· {problem.milestones} milestones</span>
                <span>· deadline {deadline}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'flex-end',
              borderTop: '1px solid rgba(28,20,16,0.06)',
              paddingTop: 12
            }}>
              <Link href={`/poster/problems/${problem.id}/enrollments`} style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#1C1410',
                textDecoration: 'none',
                border: '1px solid rgba(28,20,16,0.12)',
                borderRadius: 9,
                padding: '7px 12px',
                background: 'rgba(28,20,16,0.02)'
              }}>
                Enrolled
              </Link>
              <Link href={`/poster/problems/${problem.id}/edit`} style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#1C1410',
                textDecoration: 'none',
                border: '1px solid rgba(28,20,16,0.12)',
                borderRadius: 9,
                padding: '7px 12px',
                background: 'rgba(28,20,16,0.02)'
              }}>
                Edit
              </Link>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => updateStatus(problem.id, isOpen ? 'pending' : 'open')}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f0a08',
                  background: isOpen ? '#FCD34D' : '#BBF7D0',
                  border: '1px solid rgba(28,20,16,0.1)',
                  borderRadius: 9,
                  padding: '7px 12px',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(28,20,16,0.08)',
                  opacity: isBusy ? 0.7 : 1
                }}
              >
                {isOpen ? 'Hold' : 'Publish'}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => deleteProblem(problem.id)}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#DC2626',
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 9,
                  padding: '7px 12px',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(220,38,38,0.12)',
                  opacity: isBusy ? 0.7 : 1
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
