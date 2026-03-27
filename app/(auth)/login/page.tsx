'use client'

import Link from 'next/link'
import { SiteLogo } from '@/app/ui/site-shell'

export default function LoginPage() {
  return (
    <div className="sn-page">
      <div className="sn-auth-shell">
        <div className="sn-auth-grid">
          <section className="sn-auth-hero">
            <div className="sn-stack-md">
              <SiteLogo />
              <span className="sn-eyebrow">
                <span className="sn-eyebrow-dot" />
                Access control
              </span>
              <h1 className="sn-auth-title">
                Choose the right
                <br />
                <em>entry point.</em>
              </h1>
              <p className="sn-auth-copy">
                Separate builder and poster access keeps the challenge marketplace easy to navigate without mixing the two experiences.
              </p>
            </div>

            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>Student access</strong>
                <span>Browse live challenges, enroll, submit, and build a visible Builder Score.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Poster access</strong>
                <span>Create challenge briefs, review responses, and manage your posted problem pipeline.</span>
              </div>
            </div>
          </section>

          <section className="sn-auth-card">
            <div className="sn-stack-md">
              <div className="sn-stack-sm">
                <div className="sn-section-label">Sign in</div>
                <h2 className="sn-card-title">Choose your role</h2>
                <p className="sn-card-copy">Separate entry points keep each workflow clear without changing account logic behind the scenes.</p>
              </div>

              <div className="sn-role-grid">
                <Link href="/login/student" className="sn-role-card" style={{ textDecoration: 'none' }}>
                  <div className="sn-stack-sm">
                    <span className="sn-pill sn-pill-brand">Student</span>
                    <h3 className="sn-card-title">I am here to solve problems.</h3>
                    <p className="sn-card-copy">Sign in as a builder to browse live challenges, participate seriously, and earn public proof.</p>
                  </div>
                </Link>

                <Link href="/login/poster" className="sn-role-card" style={{ textDecoration: 'none' }}>
                  <div className="sn-stack-sm">
                    <span className="sn-pill sn-pill-accent">Poster</span>
                    <h3 className="sn-card-title">I want to post a challenge.</h3>
                    <p className="sn-card-copy">Sign in as a poster to create briefs, manage submissions, and review student thinking.</p>
                  </div>
                </Link>
              </div>

              <p className="sn-card-copy">
                Do not have an account yet? <Link href="/join" style={{ color: 'var(--sn-brand-dark)', fontWeight: 700 }}>Create one</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
