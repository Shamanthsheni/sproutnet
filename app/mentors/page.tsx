import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Navbar from '@/app/components/navbar'
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

  // Fetch pending & accepted connection requests for the current student
  let pendingMentorIds: string[] = []
  let connectedMentorIds: string[] = []
  if (currentUser?.role === 'student') {
    const { data: notifs } = await admin
      .from('notifications')
      .select('user_id, metadata')
      .eq('event_type', 'MENTOR_CONNECT_REQUEST')
      .filter('metadata->>student_id', 'eq', currentUser.id)

    if (notifs) {
      const accepted = notifs.filter((n: any) => n.metadata?.response === 'accepted').map((n: any) => n.user_id).filter(Boolean)
      const pending = notifs.filter((n: any) => !n.metadata?.response).map((n: any) => n.user_id).filter(Boolean)
      connectedMentorIds = accepted
      pendingMentorIds = pending
    }

    // Also check for accepted notifications (from respond-connect)
    if (connectedMentorIds.length === 0) {
      const { data: acceptedNotifs } = await admin
        .from('notifications')
        .select('metadata')
        .eq('event_type', 'MENTOR_ACCEPTED')
        .eq('user_id', currentUser.id)
      if (acceptedNotifs) {
        for (const n of acceptedNotifs) {
          const mid = (n as any).metadata?.mentor_id
          if (mid) connectedMentorIds.push(mid)
        }
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>

      <Navbar user={currentUser} />

      <MentorsClient
        mentors={mentors || []}
        currentUser={currentUser}
        userTeams={userTeams}
        pendingMentorIds={pendingMentorIds}
        connectedMentorIds={connectedMentorIds}
      />
    </div>
  )
}
