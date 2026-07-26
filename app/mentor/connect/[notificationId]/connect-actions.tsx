'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectActions({
  notificationId, conversationId, studentId,
}: {
  notificationId: string
  conversationId?: string | null
  studentId: string
}) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'accept' | 'decline' | null>(null)
  const router = useRouter()

  async function handle(action: 'accept' | 'decline') {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/mentors/respond-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action }),
      })
      if (res.ok) {
        setDone(action)
        router.refresh()
      }
    } catch (e) { console.error(e) }
    setBusy(false)
  }

  if (done) {
    return (
      <span style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20, background: done === 'accept' ? '#EAF4EE' : '#FEE2E2', color: done === 'accept' ? '#2D6A4F' : '#DC2626', fontWeight: 600 }}>
        {done === 'accept' ? 'Accepted ✓' : 'Declined ✕'}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => handle('accept')} disabled={busy} style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff', background: '#2D6A4F', border: 'none', padding: '9px 22px', borderRadius: 8, cursor: 'pointer', opacity: busy ? 0.6 : 1
      }}>
        {busy ? '...' : 'Accept'}
      </button>
      <button onClick={() => handle('decline')} disabled={busy} style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#7A7068', background: '#F1EFEA', border: 'none', padding: '9px 22px', borderRadius: 8, cursor: 'pointer', opacity: busy ? 0.6 : 1
      }}>
        {busy ? '...' : 'Decline'}
      </button>
    </div>
  )
}
