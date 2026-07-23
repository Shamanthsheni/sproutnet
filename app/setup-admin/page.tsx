'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetupAdminPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'promoting' | 'done' | 'error' | 'nologin'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/admin/seed', { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          setStatus('done')
          setMessage(data.message ?? 'Promoted to admin!')
        } else if (res.status === 401) {
          setStatus('nologin')
          setMessage('You need to be logged in first.')
        } else {
          const data = await res.json().catch(() => ({}))
          setStatus('error')
          setMessage(data.error ?? `Request failed (${res.status})`)
        }
      } catch {
        setStatus('error')
        setMessage('Network error')
      }
    }
    check()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#1C1410',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif', padding: 24
    }}>
      <div style={{
        background: '#FAF8F4', borderRadius: 16, padding: '40px',
        maxWidth: 440, width: '100%', textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {status === 'done' ? '✅' : status === 'error' ? '❌' : '⏳'}
        </div>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700,
          color: '#1C1410', marginBottom: 12
        }}>
          {status === 'loading' ? 'Checking...' :
           status === 'promoting' ? 'Promoting...' :
           status === 'done' ? 'You are now an admin!' :
           status === 'nologin' ? 'Not logged in' :
           'Something went wrong'}
        </h1>
        <p style={{ fontSize: 14, color: '#4A3F38', marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </p>

        {status === 'done' && (
          <button
            onClick={() => router.push('/admin')}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600,
              color: '#1C1410', background: '#F4A723', border: 'none',
              borderRadius: 8, padding: '14px 28px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}
          >
            Go to Admin Panel →
          </button>
        )}

        {status === 'nologin' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/join" style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
              color: '#1C1410', background: '#F4A723', border: 'none',
              borderRadius: 8, padding: '12px 24px', textDecoration: 'none'
            }}>
              Sign Up First
            </Link>
            <Link href="/login/student" style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
              color: '#1C1410', background: '#EAF4EE', border: 'none',
              borderRadius: 8, padding: '12px 24px', textDecoration: 'none'
            }}>
              Log In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <Link href="/login/student" style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
            color: '#1C1410', background: '#F4A723', border: 'none',
            borderRadius: 8, padding: '12px 24px', textDecoration: 'none',
            display: 'inline-block'
          }}>
            Try Logging In First
          </Link>
        )}
      </div>
    </div>
  )
}
