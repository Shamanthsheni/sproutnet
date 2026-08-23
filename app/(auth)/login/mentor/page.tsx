'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function MentorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    const profileRes = await fetch('/api/auth/profile')
    const profileData = await profileRes.json()

    if (!profileRes.ok || !profileData.profile) {
      await supabase.auth.signOut()
      setError('Profile not found. Please contact support.')
      setLoading(false)
      return
    }

    const role = profileData.profile.role

    if (role === 'mentor' || role === 'admin') {
      router.push('/mentor/dashboard')
      router.refresh()
      return
    }

    await supabase.auth.signOut()
    setError(`This account has role "${role}". Please use the appropriate login page.`)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
              <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
              <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
            </svg>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: '#1C1410' }}>
              SproutNet
            </span>
          </Link>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, fontWeight: 400, color: '#1C1410', letterSpacing: '-0.5px', lineHeight: 1.1, display: 'block' }}>
            Mentor login
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#4A3F38', marginTop: 8, fontWeight: 300 }}>
            Sign in to guide student teams and review mentorship requests.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '36px 40px', boxShadow: '0 4px 24px rgba(28,20,16,0.07)' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1410' }}>
                Mentor email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="mentor@sproutnet.org"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1410' }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="********"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1C1410',
              background: loading ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 8,
              padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
              boxShadow: '0 2px 10px rgba(244,167,35,0.3)', width: '100%'
            }}>
              {loading ? 'Signing in...' : 'Sign in as Mentor →'}
            </button>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: 'center', margin: 0 }}>
              <Link href="/forgot-password" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
            </p>

          </form>

          <div style={{ borderTop: '1px solid rgba(28,20,16,0.07)', margin: '24px 0' }} />

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9CA3A0', textAlign: 'center' }}>
            New mentor?{' '}
            <Link href="/join?role=mentor" style={{ color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}>Create mentor account</Link>
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9CA3A0', textAlign: 'center', marginTop: 8 }}>
            Looking for student access?{' '}
            <Link href="/login/student" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>Student Sign In</Link>
          </p>
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9CA3A0', textAlign: 'center', marginTop: 20 }}>
          Verified mentor accounts only · SproutNet Season 1
        </p>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9CA3A0', textAlign: 'center', marginTop: 8 }}>
          <Link href="/login" style={{ color: '#2D6A4F', textDecoration: 'none', fontWeight: 600 }}>Back to role selection</Link>
        </p>

      </div>
    </div>
  )
}
