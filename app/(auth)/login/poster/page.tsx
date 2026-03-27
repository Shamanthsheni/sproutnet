'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteLogo } from '@/app/ui/site-shell'

export default function PosterLoginPage() {
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

    if (profile.role === 'poster') {
      router.push('/poster/dashboard')
      router.refresh()
      return
    }

    if (profile.role === 'admin') {
      router.push('/dashboard')
      router.refresh()
      return
    }

    await supabase.auth.signOut()
    setError('This is a student account. Please use Student Login.')
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
                Poster login
              </span>
              <h1 className="sn-auth-title">
                Enter the
                <br />
                challenge <em>studio.</em>
              </h1>
              <p className="sn-auth-copy">
                Sign in to post real briefs, manage timelines, and review student work inside a cleaner challenge-marketplace experience.
              </p>
            </div>

            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>Brief-led workflow</strong>
                <span>Poster access is designed around challenge creation and submission review rather than generic account management.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Organisation credibility</strong>
                <span>Publish challenge briefs in a flow that feels clearer and more credible for organisations and institutions.</span>
              </div>
            </div>
          </section>

          <section className="sn-auth-card">
            <form className="sn-form-grid" onSubmit={handleLogin}>
              <div className="sn-stack-sm">
                <div className="sn-section-label">Poster access</div>
                <h2 className="sn-card-title">Poster sign in</h2>
                <p className="sn-card-copy">Use your poster credentials to manage challenges and review submitted solutions.</p>
              </div>

              {error ? <div className="sn-alert">{error}</div> : null}

              <div className="sn-field">
                <label className="sn-label" htmlFor="poster-email">
                  Work email
                </label>
                <input
                  id="poster-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  className="sn-input"
                />
              </div>

              <div className="sn-field">
                <label className="sn-label" htmlFor="poster-password">
                  Password
                </label>
                <input
                  id="poster-password"
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
                Need an account? <Link href="/join?role=poster" style={{ color: 'var(--sn-brand-dark)', fontWeight: 700 }}>Join as a poster</Link>.
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
