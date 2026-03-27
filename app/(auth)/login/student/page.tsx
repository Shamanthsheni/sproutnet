'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteLogo } from '@/app/ui/site-shell'

export default function StudentLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase.from('users').select('role').eq('id', data.user.id).single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setError('Profile not found. Please contact support.')
      setLoading(false)
      return
    }

    if (profile.role === 'student' || profile.role === 'admin') {
      router.push('/dashboard')
      router.refresh()
      return
    }

    await supabase.auth.signOut()
    setError('This is a poster account. Please use Poster Login.')
    setLoading(false)
  }

  return (
    <div className="sn-page">
      <div className="sn-auth-shell">
        <div className="sn-auth-grid">
          <section className="sn-auth-hero">
            <div className="sn-stack-md">
              <SiteLogo />
              <span className="sn-eyebrow">
                <span className="sn-eyebrow-dot" />
                Student login
              </span>
              <h1 className="sn-auth-title">
                Enter the
                <br />
                builder <em>workspace.</em>
              </h1>
              <p className="sn-auth-copy">
                Sign in to browse challenge briefs, enroll in the ones that matter, and turn careful work into visible ranking movement.
              </p>
            </div>

            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>Verified access</strong>
                <span>Student accounts are constrained to approved college domains during the current phase.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Builder-first flow</strong>
                <span>Browse live challenges, enroll with intent, and submit work inside a cleaner builder flow.</span>
              </div>
            </div>
          </section>

          <section className="sn-auth-card">
            <form className="sn-form-grid" onSubmit={handleLogin}>
              <div className="sn-stack-sm">
                <div className="sn-section-label">Builder access</div>
                <h2 className="sn-card-title">Student sign in</h2>
                <p className="sn-card-copy">Use your registered student credentials to enter the solving workflow.</p>
              </div>

              {error ? <div className="sn-alert">{error}</div> : null}

              <div className="sn-field">
                <label className="sn-label" htmlFor="student-email">
                  College email
                </label>
                <input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@jyothyit.ac.in"
                  required
                  className="sn-input"
                />
              </div>

              <div className="sn-field">
                <label className="sn-label" htmlFor="student-password">
                  Password
                </label>
                <input
                  id="student-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="sn-input"
                />
              </div>

              <button type="submit" className="sn-btn sn-btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="sn-card-copy">
                Need an account? <Link href="/join?role=student" style={{ color: 'var(--sn-brand-dark)', fontWeight: 700 }}>Join as a student</Link>.
              </p>
              <p className="sn-card-copy">
                Wrong role? <Link href="/login" style={{ color: 'var(--sn-brand-dark)', fontWeight: 700 }}>Back to role selection</Link>.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
