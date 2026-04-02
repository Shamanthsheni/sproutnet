'use client'

import Link from 'next/link'
import { SiteLogo } from '@/app/ui/site-shell'

export default function LoginPage() {
  return (
    <div className="sn-page">
      <div className="sn-auth-shell sn-auth-shell-center">
        <div className="sn-auth-grid sn-auth-grid-single">
          <section className="sn-auth-card">
            <div className="sn-stack-md">
              <div className="sn-stack-sm">
                <SiteLogo />
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
