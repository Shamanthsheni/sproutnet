import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(30px, 6vw, 42px)',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <ActionCard href="/blogs" icon="📝" title="Blogs" desc="Join the public feed to share insights and answer questions." />
          <ActionCard href="/poster/post-problem" icon="✏️" title="Post a Problem" desc="Create a new problem statement for students." />
          <ActionCard href="/poster/problems" icon="📋" title="My Problems" desc="Manage problems you have posted." />
          <ActionCard href="/poster/solutions" icon="📬" title="Student Solutions" desc="View solutions submitted by registered students." />
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
    <Link href={href} style={{
      background: '#fff',
      border: '1.5px solid rgba(28,20,16,0.07)',
      borderRadius: 12,
      padding: 'clamp(20px, 3vw, 28px)',
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
    </Link>
  )
}
