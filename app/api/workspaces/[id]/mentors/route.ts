import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity } from '@/lib/workspace/activity'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canAssign = await checkWorkspacePermission(user.id, id, 'workspace.assign_mentor', admin)
  if (!canAssign) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { mentor_id?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.mentor_id) {
    return NextResponse.json({ error: 'mentor_id is required' }, { status: 422 })
  }

  const { data: workspace } = await admin
    .from('workspaces')
    .select('*, teams(id, name)')
    .eq('id', id)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data: mentorProf } = await admin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', payload.mentor_id)
    .single()

  if (!mentorProf || mentorProf.availability_status === 'unavailable') {
    return NextResponse.json({ error: 'Mentor is not available.' }, { status: 400 })
  }

  const { count: currentAssignments } = await admin
    .from('mentor_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('mentor_id', payload.mentor_id)
    .eq('assignment_status', 'active')

  if ((currentAssignments ?? 0) >= mentorProf.max_active_teams) {
    return NextResponse.json({ error: 'Mentor has reached maximum active team capacity.' }, { status: 400 })
  }

  const { data: assignment, error } = await admin
    .from('mentor_assignments')
    .upsert({
      team_id: workspace.team_id,
      mentor_id: payload.mentor_id,
      assigned_by: user.id,
    }, { onConflict: 'team_id, mentor_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: channel } = await admin
    .from('conversations')
    .select('id')
    .eq('workspace_id', id)
    .eq('type', 'channel')
    .maybeSingle()

  if (channel) {
    await admin.from('conversation_members').upsert({
      conversation_id: channel.id,
      user_id: payload.mentor_id,
    }, { onConflict: 'conversation_id, user_id' })
  }

  await logWorkspaceActivity(id, user.id, 'MENTOR_ASSIGNED', `Mentor ${payload.mentor_id} assigned to workspace.`, { mentor_id: payload.mentor_id })

  await admin.from('notifications').insert({
    user_id: payload.mentor_id,
    event_type: 'MENTOR_ASSIGNED',
    title: 'Assigned to Workspace',
    body: `You have been assigned as mentor for "${workspace.name}".`,
    link_url: `/teams/${workspace.team_id}`,
    metadata: { workspace_id: id, team_id: workspace.team_id },
  })

  return NextResponse.json({ assignment })
}
