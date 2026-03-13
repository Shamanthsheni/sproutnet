'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CancelEnrollmentButtonProps = {
  problemId: string
  label?: string
  redirectTo?: string
  onCancelled?: () => void
  kind?: 'inline' | 'block'
}

export default function CancelEnrollmentButton({
  problemId,
  label = 'Cancel Enrollment',
  redirectTo,
  onCancelled,
  kind = 'inline',
}: CancelEnrollmentButtonProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  async function cancelEnrollment() {
    if (cancelling) return

    const confirmed = window.confirm('Cancel this enrollment? You can enroll again later if the problem is still open.')
    if (!confirmed) return

    setCancelling(true)
    setError('')

    const res = await fetch('/api/enrollments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem_id: problemId }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = `Cancellation failed (${res.status}).`
      if (text) {
        try {
          const data = JSON.parse(text)
          message = data?.error ?? message
        } catch {
          message = text
        }
      }
      setError(message)
      setCancelling(false)
      return
    }

    onCancelled?.()

    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8, width: kind === 'block' ? '100%' : 'auto' }}>
      <button
        type="button"
        onClick={cancelEnrollment}
        disabled={cancelling}
        style={{
          width: kind === 'block' ? '100%' : 'auto',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: '#7C2D12',
          background: 'rgba(234, 88, 12, 0.08)',
          border: '1px solid rgba(234, 88, 12, 0.18)',
          borderRadius: 8,
          padding: kind === 'block' ? '12px 14px' : '10px 14px',
          cursor: cancelling ? 'not-allowed' : 'pointer',
        }}
      >
        {cancelling ? 'Cancelling...' : label}
      </button>
      {error && (
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 12,
          color: '#DC2626',
          textAlign: kind === 'block' ? 'center' : 'left',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
