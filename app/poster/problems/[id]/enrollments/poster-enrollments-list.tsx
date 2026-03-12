'use client'

import { useState } from 'react'

type EnrollmentRow = {
  id: string
  created_at: string
  student_id: string
  status?: string
  users?: { name: string; dept: string; year: string } | null
}

export default function PosterEnrollmentsList({ enrollments, problemId }: { enrollments: EnrollmentRow[]; problemId: string }) {
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
      setItems(prev => prev.filter(e => e.id !== id))
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
        <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
        <div style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 18, fontWeight: 600,
          color: '#1C1410', marginBottom: 8
        }}>
          No enrollments yet
        </div>
        <div style={{ fontSize: 14, color: '#9CA3A0' }}>
          Students will appear here after they enroll.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map(enroll => (
        <div key={enroll.id} style={{
          background: '#fff',
          border: '1.5px solid rgba(28,20,16,0.07)',
          borderRadius: 12,
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#2D6A4F', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: 'Sora, sans-serif',
              fontSize: 12, fontWeight: 700
            }}>
              {enroll.users?.name?.charAt(0) ?? '?'}
            </div>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#1C1410' }}>
                {enroll.users?.name ?? 'Student'}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3A0' }}>
                {(enroll.users?.dept ?? 'Department')} · {(enroll.users?.year ?? 'Year')}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={busyId === enroll.id}
            onClick={() => removeEnrollment(enroll.id)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: '#DC2626',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: busyId === enroll.id ? 'not-allowed' : 'pointer'
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
