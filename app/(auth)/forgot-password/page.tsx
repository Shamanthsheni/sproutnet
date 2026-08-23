'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'otp' | 'password' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send code. Please try again.')
        setLoading(false)
        return
      }

      setStep('otp')
      setOtp('')
      setResendIn(60)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    // Validate now by moving on; final verification happens with reset.
    setError('')
    setStep('password')
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not reset password.')
        if (String(data.error || '').includes('Incorrect') || String(data.error || '').includes('expired')) {
          setStep('otp')
          setOtp('')
        }
        setLoading(false)
        return
      }

      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#1C1410',
    background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8,
    padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  }
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#2D6A4F' },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(28,20,16,0.12)' },
  }
  const buttonStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1C1410',
    background: loading ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 8,
    padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
    boxShadow: '0 2px 10px rgba(244,167,35,0.3)', width: '100%',
  } as const

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
            Reset your password
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#4A3F38', marginTop: 8, fontWeight: 300 }}>
            {step === 'email' && "We'll email you a 6-digit code to reset it."}
            {step === 'otp' && `Enter the code sent to ${email}.`}
            {step === 'password' && 'Choose a new password for your account.'}
            {step === 'done' && 'Your password has been updated.'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '36px 40px', boxShadow: '0 4px 24px rgba(28,20,16,0.07)' }}>

          {step !== 'done' ? (
            <form onSubmit={step === 'email' ? handleSendCode : step === 'otp' ? handleVerifyCode : handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {error && (
                <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                  {error}
                </div>
              )}

              {step === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1410' }}>
                    College email
                  </label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@jyothyit.ac.in"
                    style={inputStyle} {...focusHandlers}
                  />
                </div>
              )}

              {step === 'otp' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1410' }}>
                      6-digit code
                    </label>
                    <input
                      type="text" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required placeholder="••••••" inputMode="numeric" autoComplete="one-time-code"
                      style={{ ...inputStyle, fontSize: 24, letterSpacing: 12, textAlign: 'center', fontWeight: 600 }}
                      {...focusHandlers}
                    />
                  </div>

                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9CA3A0', margin: 0 }}>
                    Didn&apos;t get it?{' '}
                    {resendIn > 0 ? (
                      <span>Resend in {resendIn}s</span>
                    ) : (
                      <button type="button" onClick={() => handleSendCode()} disabled={loading} style={{ background: 'none', border: 'none', padding: 0, color: '#2D6A4F', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        Resend code
                      </button>
                    )}
                  </p>
                </>
              )}

              {step === 'password' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1410' }}>
                      New password
                    </label>
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters"
                      style={inputStyle} {...focusHandlers}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1410' }}>
                      Confirm new password
                    </label>
                    <input
                      type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} placeholder="Re-enter password"
                      style={inputStyle} {...focusHandlers}
                    />
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} style={buttonStyle}>
                {step === 'email' && (loading ? 'Sending...' : 'Send code →')}
                {step === 'otp' && 'Verify code →'}
                {step === 'password' && (loading ? 'Updating...' : 'Reset password →')}
              </button>

              {(step === 'otp' || step === 'password') && !loading && (
                <button type="button" onClick={() => { setStep(step === 'otp' ? 'email' : 'otp'); setError('') }} style={{ background: 'none', border: 'none', padding: 0, color: '#9CA3A0', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  ← Back
                </button>
              )}

            </form>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 56, height: 56, margin: '0 auto', background: 'rgba(45,106,79,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#4A3F38', margin: 0 }}>
                You can now sign in with your new password.
              </p>
              <button onClick={() => router.push('/login')} style={buttonStyle}>
                Back to login →
              </button>
            </div>
          )}

        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9CA3A0', textAlign: 'center', marginTop: 20 }}>
          <Link href="/login" style={{ color: '#2D6A4F', textDecoration: 'none', fontWeight: 600 }}>Back to role selection</Link>
        </p>

      </div>
    </div>
  )
}
