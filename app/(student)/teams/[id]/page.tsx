import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import TeamWorkspaceClient from './team-workspace-client'

export default async function TeamWorkspacePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const teamId = params.id

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check user membership or mentor assignment
  const { data: membership } = await admin
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: mentorAssignment } = await admin
    .from('mentor_assignments')
    .select('id')
    .eq('team_id', teamId)
    .eq('mentor_id', user.id)
    .maybeSingle()

  const { data: userProfile } = await supabase
    .from('users')
    .select('role, is_master')
    .eq('id', user.id)
    .single()

  const isAdmin = userProfile?.is_master || userProfile?.role === 'admin'
  const isMember = !!membership
  const isMentor = !!mentorAssignment
  const isLeader = membership?.role === 'leader'

  if (!isMember && !isMentor && !isAdmin) {
    redirect('/dashboard')
  }

  // Fetch Team Details
  const { data: team } = await admin
    .from('teams')
    .select('*, problems(id, title, domain, team_mode, min_team_size, max_team_size, mentor_required, max_mentors_per_team)')
    .eq('id', teamId)
    .single()

  if (!team) redirect('/dashboard')

  // Fetch Team Members
  const { data: members } = await admin
    .from('team_members')
    .select('id, role, joined_at, user_id, users(id, name, email, profile_slug)')
    .eq('team_id', teamId)

  // Fetch Assigned Mentors
  const { data: assignedMentors } = await admin
    .from('mentor_assignments')
    .select('assigned_at, mentor_id, users(id, name, email), mentor_profiles(*)')
    .eq('team_id', teamId)

  // Fetch Workspace & Conversation Channel
  const { data: workspace } = await admin
    .from('workspaces')
    .select('*')
    .eq('team_id', teamId)
    .single()

  let channelId: string | null = null
  if (workspace) {
    const { data: channel } = await admin
      .from('conversations')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('type', 'channel')
      .maybeSingle()
    channelId = channel?.id || null
  }

  // Fetch Available Mentors for Request Modal
  const { data: mentorsList } = await admin
    .from('mentor_profiles')
    .select('user_id, bio, skills, technologies, availability_status, max_active_teams, users(id, name, email)')
    .eq('availability_status', 'available')

  // Fetch Activity Logs
  const { data: activityLogs } = await admin
    .from('activity_logs')
    .select('id, action_type, description, created_at, actor_id, users:actor_id(name)')
    .eq('workspace_id', workspace?.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <TeamWorkspaceClient
      team={team}
      currentUserId={user.id}
      isLeader={isLeader}
      isMentor={isMentor}
      isAdmin={isAdmin}
      members={members || []}
      assignedMentors={assignedMentors || []}
      availableMentors={mentorsList || []}
      workspace={workspace}
      channelId={channelId}
      activityLogs={activityLogs || []}
    />
  )
}
