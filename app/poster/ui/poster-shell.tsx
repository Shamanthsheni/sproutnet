import Link from 'next/link'
import { SiteLogo } from '@/app/ui/site-shell'

const NAV_ITEMS = [
  { href: '/poster/dashboard', label: 'Dashboard' },
  { href: '/poster/problems', label: 'My Problems' },
  { href: '/poster/post-problem', label: 'Post Problem' },
  { href: '/poster/solutions', label: 'Solutions' },
]

function isActive(currentPath: string, href: string) {
  return currentPath === href || currentPath.startsWith(`${href}/`)
}

export function PosterHeader({ currentPath, posterName }: { currentPath: string; posterName: string }) {
  return (
    <div className="sn-nav-shell">
      <nav className="sn-nav">
        <SiteLogo href="/poster/dashboard" />

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
          <span className="sn-inline-chip">Poster</span>
          <span className="sn-user-name">{posterName}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="sn-btn sn-btn-light">
              Sign out
            </button>
          </form>
        </div>

        <details className="sn-mobile-menu">
          <summary aria-label="Open poster navigation menu">
            <span className="sn-mobile-icon" aria-hidden="true" />
            <span>Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            <span className="sn-meta">Signed in as</span>
            <span className="sn-user-name">{posterName}</span>
            {NAV_ITEMS.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={`sn-btn ${isActive(currentPath, item.href) ? 'sn-btn-secondary' : 'sn-btn-light'}`}
              >
                {item.label}
              </Link>
            ))}
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="sn-btn sn-btn-light">
                Sign out
              </button>
            </form>
          </div>
        </details>
      </nav>
    </div>
  )
}
