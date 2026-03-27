'use client'

import { useState } from 'react'
import Link from 'next/link'

type ProblemRow = {
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

function problemTypeLabel(value: string) {
  return value === 'industry_challenge' ? 'Industry challenge' : 'Public impact'
}

export default function PosterProblemsList({ problems }: { problems: ProblemRow[] }) {
  const [items, setItems] = useState(problems)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setBusyId(id)
    const res = await fetch('/api/problems/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setItems((prev) => prev.map((problem) => (problem.id === id ? { ...problem, status } : problem)))
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
      setItems((prev) => prev.filter((problem) => problem.id !== id))
    }
    setBusyId(null)
  }

  if (items.length === 0) {
    return (
      <div className="sn-empty sn-stack-sm">
        <div className="sn-section-label">Problem management</div>
        <h3 className="sn-card-title">No problems yet</h3>
        <p className="sn-card-copy">
          Post your first challenge brief to start collecting enrollments and serious student submissions.
        </p>
        <div className="sn-cta-row" style={{ marginTop: 4, justifyContent: 'center' }}>
          <Link href="/poster/post-problem" className="sn-btn sn-btn-primary">
            Post a problem
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="sn-stack-md">
      {items.map((problem) => {
        const isOpen = problem.status === 'open'
        const isBusy = busyId === problem.id
        const deadline = new Date(problem.deadline).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        const createdAt = new Date(problem.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        return (
          <article key={problem.id} className="sn-card sn-stack-md">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div className="sn-stack-sm" style={{ flex: '1 1 320px' }}>
                <div className="sn-badge-row" style={{ marginTop: 0 }}>
                  <span className="sn-pill sn-pill-brand">{problem.domain}</span>
                  <span className={problem.problem_type === 'industry_challenge' ? 'sn-pill sn-pill-accent' : 'sn-pill sn-pill-light'}>
                    {problemTypeLabel(problem.problem_type)}
                  </span>
                  <span className={isOpen ? 'sn-pill sn-pill-light' : 'sn-pill sn-pill-accent'}>
                    {isOpen ? 'Live' : 'On hold'}
                  </span>
                </div>
                <h3 className="sn-card-title">{problem.title}</h3>
                <p className="sn-card-copy">
                  Keep the brief live, review who has enrolled, and update the details without leaving this management view.
                </p>
              </div>

              <div className="sn-stack-sm" style={{ minWidth: 160 }}>
                <span className="sn-meta">Created</span>
                <span className="sn-inline-heading" style={{ fontSize: 16 }}>
                  {createdAt}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <div className="sn-surface sn-stack-sm">
                <span className="sn-meta">Deadline</span>
                <strong className="sn-inline-heading">{deadline}</strong>
                <p className="sn-card-copy">Submission window closes on this date.</p>
              </div>
              <div className="sn-surface sn-stack-sm">
                <span className="sn-meta">Milestones</span>
                <strong className="sn-inline-heading">{problem.milestones}</strong>
                <p className="sn-card-copy">Structured checkpoints expected from students.</p>
              </div>
              <div className="sn-surface sn-stack-sm">
                <span className="sn-meta">Submissions</span>
                <strong className="sn-inline-heading">{problem.submission_count ?? 0}</strong>
                <p className="sn-card-copy">Solutions received against this challenge.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link href={`/poster/problems/${problem.id}/enrollments`} className="sn-btn sn-btn-light">
                View enrollments
              </Link>
              <Link href={`/poster/problems/${problem.id}/edit`} className="sn-btn sn-btn-light">
                Edit problem
              </Link>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => updateStatus(problem.id, isOpen ? 'pending' : 'open')}
                className={`sn-btn ${isOpen ? 'sn-btn-light' : 'sn-btn-secondary'}`}
                style={{ opacity: isBusy ? 0.65 : 1, cursor: isBusy ? 'not-allowed' : 'pointer' }}
              >
                {isOpen ? 'Move to hold' : 'Publish now'}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => deleteProblem(problem.id)}
                className="sn-btn sn-btn-danger"
                style={{ opacity: isBusy ? 0.65 : 1, cursor: isBusy ? 'not-allowed' : 'pointer' }}
              >
                Delete
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
