import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { inviteCode } = await req.json().catch(() => ({}))
  if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 422 })
  }

  const code = inviteCode.trim().toUpperCase()

  // Find team by invite code
  const { data: team } = await admin
    .from('teams')
    .select('id, name, leader_id, problem_id, problems(max_team_size)')
    .eq('invite_code', code)
    .single()

  if (!team) {
    return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 })
  }

  // Check current team size
  const { count: memberCount } = await admin
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', team.id)

  const maxLimit = team.problems ? (team.problems as any).max_team_size : 4

  if ((memberCount ?? 0) >= maxLimit) {
    return NextResponse.json({ error: `Team capacity limit (${maxLimit} members) reached.` }, { status: 400 })
  }

  // Insert into team_members
  const { error: joinErr } = await admin
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'member'
    })

  if (joinErr) {
    if (joinErr.code === '23505') {
      return NextResponse.json({ error: 'You are already a member of this team.' }, { status: 400 })
    }
    return NextResponse.json({ error: joinErr.message }, { status: 400 })
  }

  // Add to workspace channel members
  const { data: workspace } = await admin
    .from('workspaces')
    .select('id')
    .eq('team_id', team.id)
    .maybeSingle()

  if (workspace) {
    const { data: channel } = await admin
      .from('conversations')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('type', 'channel')
      .maybeSingle()

    if (channel) {
      await admin.from('conversation_members').upsert({
        conversation_id: channel.id,
        user_id: user.id
      }, { onConflict: 'conversation_id, user_id' })
    }

    // Log Activity
    const { data: userProfile } = await admin.from('users').select('name').eq('id', user.id).single()
    const userName = userProfile?.name || 'A student'

    await admin.from('activity_logs').insert({
      workspace_id: workspace.id,
      actor_id: user.id,
      action_type: 'MEMBER_JOINED',
      description: `${userName} joined the team using invite code.`,
      metadata: { user_id: user.id }
    })

    // Send Notification to Team Leader
    if (team.leader_id !== user.id) {
      await admin.from('notifications').insert({
        user_id: team.leader_id,
        event_type: 'TEAM_MEMBER_JOINED',
        title: 'New Team Member Joined!',
        body: `${userName} joined your team "${team.name}".`,
        link_url: `/teams/${team.id}`,
        metadata: { team_id: team.id, member_id: user.id }
      })
    }
  }

  return NextResponse.json({ ok: true, teamId: team.id, teamName: team.name })
}
