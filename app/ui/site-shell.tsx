import type { ReactNode } from 'react'
import Link from 'next/link'

type HeaderAction = {
  href: string
  label: string
  tone?: 'primary' | 'secondary' | 'light' | 'ghost'
}

type SiteHeaderProps = {
  currentPath: string
  actions?: HeaderAction[]
}

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/problems', label: 'Marketplace' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/leaderboard', label: 'Community' },
]

function isActive(currentPath: string, href: string) {
  if (href === '/') return currentPath === '/'
  return currentPath === href || currentPath.startsWith(`${href}/`)
}

function actionClassName(tone: HeaderAction['tone'] = 'secondary') {
  if (tone === 'primary') return 'sn-btn sn-btn-primary'
  if (tone === 'light') return 'sn-btn sn-btn-light'
  if (tone === 'ghost') return 'sn-btn sn-btn-ghost'
  return 'sn-btn sn-btn-secondary'
}

export function SiteLogo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="sn-logo">
      <span className="sn-logo-badge" aria-hidden="true">
        <svg viewBox="0 0 34 34" fill="none">
          <rect width="34" height="34" rx="12" fill="#E95420" />
          <line x1="17" y1="27" x2="17" y2="15" stroke="#FFF4EE" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#FFD4C2" />
          <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="#77216F" fillOpacity="0.9" />
        </svg>
      </span>
      <span className="sn-logo-text">
        <span className="sn-logo-accent">Sprout</span>Net
      </span>
    </Link>
  )
}

export function SiteHeader({ currentPath, actions = [] }: SiteHeaderProps) {
  return (
    <div className="sn-nav-shell">
      <nav className="sn-nav">
        <SiteLogo />

        <div className="sn-nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sn-nav-link${isActive(currentPath, item.href) ? ' is-active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="sn-nav-actions">
          {actions.map((action) => (
            <Link key={`${action.href}-${action.label}`} href={action.href} className={actionClassName(action.tone)}>
              {action.label}
            </Link>
          ))}
        </div>

        <details className="sn-mobile-menu">
          <summary aria-label="Open navigation menu">
            <span className="sn-mobile-icon" aria-hidden="true" />
            <span>Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={actionClassName(isActive(currentPath, item.href) ? 'secondary' : 'ghost')}>
                {item.label}
              </Link>
            ))}
            {actions.length > 0 && <span className="sn-meta-dark">Actions</span>}
            {actions.map((action) => (
              <Link key={`mobile-${action.href}-${action.label}`} href={action.href} className={actionClassName(action.tone)}>
                {action.label}
              </Link>
            ))}
          </div>
        </details>
      </nav>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="sn-footer">
      <div className="sn-footer-inner">
        <div className="sn-footer-grid">
          <div className="sn-stack-sm">
            <SiteLogo />
            <p className="sn-footer-copy">
              SproutNet turns real challenges into structured student work.
              Browse live problems, submit serious solutions, and build visible
              proof through a challenge marketplace designed for students,
              organisations, and universities.
            </p>
          </div>

          <div className="sn-stack-sm">
            <div className="sn-meta-dark">Explore</div>
            <div className="sn-footer-links">
              <Link href="/">Home</Link>
              <Link href="/problems">Marketplace</Link>
              <Link href="/how-it-works">How It Works</Link>
              <Link href="/leaderboard">Community</Link>
            </div>
          </div>

          <div className="sn-stack-sm">
            <div className="sn-meta-dark">Access</div>
            <div className="sn-footer-links">
              <Link href="/login/student">Student Login</Link>
              <Link href="/login/poster">Poster Login</Link>
              <Link href="/join">Create Account</Link>
            </div>
          </div>
        </div>

        <div
          className="sn-subtle"
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 13,
          }}
        >
          Structured thinking for real India.
        </div>
      </div>
    </footer>
  )
}

type SectionIntroProps = {
  label: string
  title: ReactNode
  copy?: ReactNode
  dark?: boolean
  center?: boolean
}

export function SectionIntro({ label, title, copy, dark = false, center = false }: SectionIntroProps) {
  return (
    <div className={`sn-stack-sm${center ? ' sn-center' : ''}`}>
      <div className="sn-section-label">{label}</div>
      <h2 className={`sn-section-title${dark ? ' sn-section-title-dark' : ''}`}>{title}</h2>
      {copy ? (
        <p className={`sn-section-copy${dark ? ' sn-section-copy-dark' : ''}`}>{copy}</p>
      ) : null}
    </div>
  )
}
