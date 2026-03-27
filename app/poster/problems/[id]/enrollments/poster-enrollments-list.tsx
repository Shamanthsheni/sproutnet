'use client'

import { useState } from 'react'

type EnrollmentRow = {
  id: string
  created_at: string
  student_id: string
  status?: string
  users?: { name: string; dept: string; year: string } | null
}

export default function PosterEnrollmentsList({
  enrollments,
  problemId,
}: {
  enrollments: EnrollmentRow[]
  problemId: string
}) {
  const [items, setItems] = useState(enrollments)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function removeEnrollment(id: string) {
    if (!confirm('Remove this student? They will not be able to submit.')) return
    setBusyId(id)
    const res = await fetch('/api/enrollments/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: id, problem_id: problemId }),
    })
    if (res.ok) {
      setItems((prev) => prev.filter((enrollment) => enrollment.id !== id))
    }
    setBusyId(null)
  }

  if (items.length === 0) {
    return (
      <div className="sn-empty sn-stack-sm">
        <div className="sn-section-label">No enrollments yet</div>
        <h3 className="sn-card-title">Students have not joined this brief.</h3>
        <p className="sn-card-copy">Active enrollments will appear here after students opt into the problem.</p>
      </div>
    )
  }

  return (
    <div className="sn-stack-md">
      {items.map((enrollment) => (
        <article key={enrollment.id} className="sn-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                className="sn-avatar"
                style={{ background: 'linear-gradient(135deg, var(--sn-brand), var(--sn-brand-dark))' }}
              >
                {enrollment.users?.name?.charAt(0) ?? '?'}
              </div>

              <div className="sn-stack-sm" style={{ gap: 4 }}>
                <strong className="sn-inline-heading" style={{ fontSize: 16 }}>
                  {enrollment.users?.name ?? 'Student'}
                </strong>
                <span className="sn-card-copy">
                  {(enrollment.users?.dept ?? 'Department')} · {(enrollment.users?.year ?? 'Year')}
                </span>
                <span className="sn-meta">
                  Enrolled{' '}
                  {new Date(enrollment.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={busyId === enrollment.id}
              onClick={() => removeEnrollment(enrollment.id)}
              className="sn-btn sn-btn-danger"
              style={{
                opacity: busyId === enrollment.id ? 0.65 : 1,
                cursor: busyId === enrollment.id ? 'not-allowed' : 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
