'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavbarUser = {
  id: string
  name?: string
  role?: string
  is_master?: boolean
  profile_slug?: string | null
}

export default function Navbar({ user }: { user?: NavbarUser | null }) {
  const currentPath = usePathname()

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  const linkStyle = (path: string) => ({
    fontSize: 14,
    fontWeight: isActive(path) ? 600 : 500,
    color: isActive(path) ? '#1C1410' : '#4A3F38',
    textDecoration: 'none',
  })

  const isPoster = user?.role === 'poster'
  const dashboardHref = isPoster ? '/poster/dashboard' : '/dashboard'
  const roleLabel = user?.is_master ? 'Master Admin' : user?.role
  const hasProfile = user?.name && user?.role

  const AVATAR_COLORS = ['#2D6A4F', '#1E40AF', '#9C6344', '#6B4C2A', '#3D8A65', '#4A3F38', '#7C3AED', '#BE123C']
  function avatarColor(name: string) {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  }
  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <nav
      style={{
        minHeight: 66,
        height: 'auto',
        padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: 10,
        columnGap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <rect width="34" height="34" rx="8" fill="#2D6A4F" />
          <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723" />
          <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)" />
        </svg>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>
          SproutNet
        </span>
      </Link>

      <div className="sn-nav-actions" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
        <Link href="/problems" style={linkStyle('/problems')}>
          Problems
        </Link>
        <Link href="/solutions" style={linkStyle('/solutions')}>
          Solutions
        </Link>
        <Link href="/blogs" style={linkStyle('/blogs')}>
          Blogs
        </Link>
        <Link href="/leaderboard" style={linkStyle('/leaderboard')}>
          Leaderboard
        </Link>
        <Link href="/mentors" style={linkStyle('/mentors')}>
          Mentors
        </Link>
        {hasProfile && (
          <Link href={`/profile/${user?.profile_slug || user?.id}`} style={linkStyle('/profile')}>
            My Portfolio
          </Link>
        )}

        {user ? (
          <>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1C1410',
                  background: '#EAF4EE',
                  padding: '6px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Admin Panel
              </Link>
            )}
            {isPoster && (
              <Link
                href="/post-problem"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1C1410',
                  background: '#EAF4EE',
                  padding: '6px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Post a Problem
              </Link>
            )}
            {hasProfile && (
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: '#2D6A4F',
                  background: '#EAF4EE',
                  padding: '4px 12px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {roleLabel}
              </span>
            )}
            {user?.name && (
              <Link
                href={`/profile/${user.profile_slug || user.id}`}
                style={{
                  fontSize: 14, color: '#4A3F38', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: avatarColor(user.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {initials(user.name)}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38' }}>{user.name}</span>
              </Link>
            )}
            <Link
              href="/messages"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1C1410',
                background: '#F4A723',
                padding: '6px 14px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Messages
            </Link>
            <Link
              href="/notifications"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#2D6A4F',
                background: '#EAF4EE',
                padding: '6px 14px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Notifications
            </Link>
            <Link
              href={dashboardHref}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1C1410',
                background: '#F4A723',
                padding: '8px 20px',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              Dashboard →
            </Link>
            <form action="/api/auth/signout" method="POST" style={{ display: 'inline' }}>
              <button
                type="submit"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  color: '#9CA3A0',
                  background: 'none',
                  border: '1px solid rgba(28,20,16,0.12)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38', textDecoration: 'none' }}
            >
              Sign In
            </Link>
            <Link
              href="/join"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1C1410',
                background: '#F4A723',
                padding: '8px 20px',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              Join →
            </Link>
          </>
        )}
      </div>

      <details className="sn-mobile-menu">
        <summary aria-label="Open navigation menu">
          <span className="sn-menu-icon" aria-hidden="true"></span>
          <span className="sn-menu-label">Menu</span>
        </summary>
        <div className="sn-mobile-panel">
          <Link href="/problems">Problems</Link>
          <Link href="/solutions">Solutions</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/mentors">Mentors</Link>
          {user ? (
            <>
              <Link href={`/profile/${user.profile_slug || user.id}`}>My Portfolio</Link>
              {user?.role === 'admin' && <Link href="/admin">Admin Panel</Link>}
              {isPoster && <Link href="/post-problem">Post a Problem</Link>}
              <Link href="/messages">Messages</Link>
              <Link href="/notifications">Notifications</Link>
              <Link href={dashboardHref} className="sn-menu-primary">
                Dashboard →
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="sn-menu-ghost"
                  style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, padding: '8px 10px', borderRadius: 8, marginTop: 4 }}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="sn-menu-ghost">
                Sign In
              </Link>
              <Link href="/join" className="sn-menu-primary">
                Join →
              </Link>
            </>
          )}
        </div>
      </details>
    </nav>
  )
}