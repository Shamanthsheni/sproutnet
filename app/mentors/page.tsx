import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MentorsClient from './mentors-client'

export default async function MentorsDirectoryPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  let currentUser: { id: string; name: string; role: string } | null = null
  let userTeams: Array<{ id: string; name: string }> = []

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', user.id)
      .single()
    if (profile) {
      currentUser = profile

      if (profile.role === 'student') {
        const { data: tmRows } = await admin
          .from('team_members')
          .select('team_id, teams(id, name)')
          .eq('user_id', profile.id)
        userTeams = (tmRows || [])
          .map((r: any) => r.teams)
          .filter(Boolean)
          .map((t: any) => ({ id: t.id, name: t.name }))
      }
    }
  }

  const rawMentors = await admin
    .from('mentor_profiles')
    .select('user_id, bio, skills, technologies, experience_years, linkedin_url, github_url, availability_status, max_active_teams, users(id, name, email)')
    .order('experience_years', { ascending: false })

  const mentors: Array<{
    user_id: string
    bio: string | null
    skills: string[]
    technologies: string[]
    experience_years: number
    linkedin_url: string | null
    github_url: string | null
    availability_status: string
    max_active_teams: number
    users: { id: string; name: string; email: string } | null
  }> = (rawMentors.data || []).map((m: any) => ({
    ...m,
    users: Array.isArray(m.users) ? (m.users[0] || null) : (m.users || null)
  }))

  // Fetch pending connection requests for the current student
  let pendingMentorIds: string[] = []
  if (currentUser?.role === 'student') {
    const { data: pendingReqs } = await admin
      .from('notifications')
      .select('user_id')
      .eq('event_type', 'MENTOR_CONNECT_REQUEST')
      .filter('metadata->>student_id', 'eq', currentUser.id)
    if (pendingReqs) {
      pendingMentorIds = pendingReqs.map((n: any) => n.user_id).filter(Boolean)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        minHeight: 66, padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex', flexWrap: 'wrap', rowGap: 10, columnGap: 16,
        alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)', borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>
            SproutNet
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', rowGap: 8 }}>
          {currentUser ? (
            <>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', background: '#EAF4EE', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {currentUser.role}
              </span>
              <span style={{ fontSize: 14, color: '#4A3F38' }}>{currentUser.name}</span>
              <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '8px 20px', borderRadius: 6, textDecoration: 'none' }}>
                Dashboard
              </Link>
            </>
          ) : (
            <Link href="/login/student" style={{ fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '8px 20px', borderRadius: 6, textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <MentorsClient
        mentors={mentors || []}
        currentUser={currentUser}
        userTeams={userTeams}
        pendingMentorIds={pendingMentorIds}
      />
    </div>
  )
}
