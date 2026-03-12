import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PosterDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/poster')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login/poster')
  if (profile.role === 'student') redirect('/dashboard')
  if (profile.role === 'admin') redirect('/dashboard')

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F4',
      fontFamily: 'DM Sans, sans-serif'
    }}>

      {/* Nav */}
      <nav style={{
        height: 66,
        padding: '0 52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>
            SproutNet
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#2D6A4F',
            background: '#EAF4EE',
            padding: '4px 12px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            {profile.is_master ? 'Master Admin' : profile.role}
          </span>
          <span style={{ fontSize: 14, color: '#4A3F38' }}>{profile.name}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#9CA3A0',
              background: 'none',
              border: '1px solid rgba(28,20,16,0.12)',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer'
            }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 42,
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Welcome back, {profile.name.split(' ')[0]}.
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300 }}>
            Post new problems and review student solutions.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <ActionCard href="/poster/post-problem" icon="✏️" title="Post a Problem" desc="Create a new problem statement for students." />
          <ActionCard href="/poster/problems" icon="📋" title="My Problems" desc="Manage problems you have posted." />
          <ActionCard href="/poster/solutions" icon="📬" title="Student Solutions" desc="View solutions submitted by registered students." />
        </div>

      </div>
    </div>
  )
}

function ActionCard({ href, icon, title, desc }: {
  href: string
  icon: string
  title: string
  desc: string
}) {
  return (
    <a href={href} style={{
      background: '#fff',
      border: '1.5px solid rgba(28,20,16,0.07)',
      borderRadius: 12,
      padding: '28px',
      textDecoration: 'none',
      display: 'block',
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: 15,
        fontWeight: 600,
        color: '#1C1410',
        marginBottom: 6
      }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#4A3F38', fontWeight: 300, lineHeight: 1.5 }}>
        {desc}
      </div>
    </a>
  )
}
