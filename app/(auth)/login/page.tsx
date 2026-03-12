'use client'

import Link from 'next/link'

export default function LoginPage() {
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
            Choose your sign in
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#4A3F38', marginTop: 8, fontWeight: 300 }}>
            Separate access for students and problem posters.
          </p>
        </div>

        {/* Role selector */}
        <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '36px 40px', boxShadow: '0 4px 24px rgba(28,20,16,0.07)' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <a href="/login/student" style={{
              display: 'block', textDecoration: 'none',
              border: '1.5px solid rgba(28,20,16,0.1)', borderRadius: 12, padding: '18px 20px',
              background: '#FAF8F4'
            }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: '#1C1410' }}>
                I&apos;m a Student
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4A3F38', marginTop: 6, fontWeight: 300 }}>
                Sign in to browse problems and submit solutions.
              </div>
            </a>

            <a href="/login/poster" style={{
              display: 'block', textDecoration: 'none',
              border: '1.5px solid rgba(28,20,16,0.1)', borderRadius: 12, padding: '18px 20px',
              background: '#FAF8F4'
            }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: '#1C1410' }}>
                I&apos;m a Problem Poster
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4A3F38', marginTop: 6, fontWeight: 300 }}>
                Sign in to post a problem and review submissions.
              </div>
            </a>
          </div>

          <div style={{ borderTop: '1px solid rgba(28,20,16,0.07)', margin: '24px 0' }} />

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9CA3A0', textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link href="/join" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>Join SproutNet</Link>
          </p>
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9CA3A0', textAlign: 'center', marginTop: 20 }}>
          Verified student & poster accounts only · Season 1 open
        </p>

      </div>
    </div>
  )
}
