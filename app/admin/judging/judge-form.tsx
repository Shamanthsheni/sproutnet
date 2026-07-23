'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function JudgeForm({ submissionId }: { submissionId: string }) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(7)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleJudge() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/submissions/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId, score, feedback: feedback || undefined }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to judge')
      return
    }
    setDone(true)
    router.refresh()
  }

  if (done) {
    return <span style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600 }}>✓ Judged</span>
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="admin-btn"
        style={{ background: open ? 'var(--bg-hover)' : undefined }}
      >
        {open ? 'Cancel' : 'Judge'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 40, zIndex: 50,
          background: '#1C1410', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: 16, width: 240,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              Score (0–10)
            </label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: `1.5px solid ${score === n ? '#F4A723' : 'rgba(255,255,255,0.15)'}`,
                    background: score === n ? 'rgba(244,167,35,0.15)' : 'transparent',
                    color: score === n ? '#F4A723' : 'rgba(255,255,255,0.6)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 10px',
                fontSize: 12, color: '#fff', resize: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 8 }}>{error}</div>
          )}

          <button
            onClick={handleJudge}
            disabled={saving}
            style={{
              width: '100%', padding: '9px 0',
              background: saving ? '#6B5E52' : '#F4A723',
              color: '#1C1410', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : `Submit Score (${score}/10)`}
          </button>
        </div>
      )}
    </div>
  )
}
