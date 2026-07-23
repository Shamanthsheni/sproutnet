import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { problemId, teamName } = await req.json().catch(() => ({}))

  if (!problemId || !teamName || typeof teamName !== 'string' || !teamName.trim()) {
    return NextResponse.json({ error: 'Problem ID and team name are required' }, { status: 422 })
  }

  // Check if problem exists
  const { data: problem } = await admin
    .from('problems')
    .select('id, title, max_team_size, team_mode')
    .eq('id', problemId)
    .single()

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
  }

  if (problem.team_mode === 'solo') {
    return NextResponse.json({ error: 'This problem only allows solo participation.' }, { status: 400 })
  }

  // Generate unique invite code (e.g. SPROUT-8CHAR)
  const inviteCode = `SPROUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  // Insert Team
  const { data: team, error: teamErr } = await admin
    .from('teams')
    .insert({
      problem_id: problemId,
      leader_id: user.id,
      name: teamName.trim(),
      invite_code: inviteCode
    })
    .select()
    .single()

  if (teamErr || !team) {
    return NextResponse.json({ error: teamErr?.message || 'Failed to create team' }, { status: 400 })
  }

  // Insert Leader into team_members
  await admin.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'leader'
  })

  // Create Workspace for Team
  const { data: workspace } = await admin
    .from('workspaces')
    .insert({ team_id: team.id })
    .select()
    .single()

  if (workspace) {
    // Create General Chat Channel
    const { data: channel } = await admin
      .from('conversations')
      .insert({
        workspace_id: workspace.id,
        type: 'channel',
        name: 'general',
        description: 'General workspace discussion',
        created_by: user.id
      })
      .select()
      .single()

    if (channel) {
      await admin.from('conversation_members').insert({
        conversation_id: channel.id,
        user_id: user.id
      })
    }

    // Log Activity
    await admin.from('activity_logs').insert({
      workspace_id: workspace.id,
      actor_id: user.id,
      action_type: 'TEAM_CREATED',
      description: `Team "${team.name}" created by leader.`,
      metadata: { leader_id: user.id }
    })
  }

  return NextResponse.json({ ok: true, teamId: team.id, inviteCode })
}
