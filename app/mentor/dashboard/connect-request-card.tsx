'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  id: string
  studentName: string
  message?: string
  studentId?: string
  conversationId?: string
}

export default function ConnectRequestCard({ id, studentName, message, studentId, conversationId }: Props) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending')
  const [busy, setBusy] = useState(false)

  async function handle(action: 'accept' | 'decline') {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/mentors/respond-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action }),
      })
      if (res.ok) setStatus(action === 'accept' ? 'accepted' : 'declined')
      else console.error('respond-connect failed', await res.text())
    } catch (e) { console.error(e) }
    setBusy(false)
  }

  if (status !== 'pending') {
    return (
      <div style={{ background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.06)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontWeight: 600 }}>{studentName}</span>
          <span style={{ marginLeft: 10, fontSize: 12, padding: '3px 8px', borderRadius: 20, background: status === 'accepted' ? '#EAF4EE' : '#F1EFEA', color: status === 'accepted' ? '#2D6A4F' : '#7A7068', textTransform: 'capitalize' }}>
            {status}
          </span>
        </div>
        {studentId && (
          <Link href={`/messages?user=${studentId}`} style={{ fontSize: 13, color: '#2D6A4F', textDecoration: 'none' }}>
            Start Chat →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1.5px solid rgba(139,92,246,0.15)', borderRadius: 14, padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Individual Connection
        </div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginTop: 4 }}>
          From: {studentName}
        </div>
        {message && (
          <div style={{ fontSize: 13, color: '#7A7068', fontStyle: 'italic', marginTop: 8, background: '#FAF8F4', padding: '8px 12px', borderRadius: 8 }}>
            &ldquo;{message}&rdquo;
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href={`/mentor/connect/${id}`} style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#8B5CF6', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', padding: '9px 18px', borderRadius: 8, textDecoration: 'none'
        }}>
          View Profile →
        </Link>
        <button onClick={() => handle('accept')} disabled={busy} style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff', background: '#2D6A4F', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', opacity: busy ? 0.6 : 1
        }}>
          {busy ? '...' : 'Accept'}
        </button>
        <button onClick={() => handle('decline')} disabled={busy} style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#7A7068', background: '#F1EFEA', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', opacity: busy ? 0.6 : 1
        }}>
          {busy ? '...' : 'Decline'}
        </button>
        {studentId && (
          <Link href={`/messages?user=${studentId}`} style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#1C1410', background: '#F4A723', border: 'none', padding: '9px 18px', borderRadius: 8, textDecoration: 'none'
          }}>
            Start Chat →
          </Link>
        )}
      </div>
    </div>
  )
}
