import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceRole } from '@/lib/workspace/permissions'
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

  const role = await getWorkspaceRole(user.id, id, admin)
  if (role !== 'leader') return NextResponse.json({ error: 'Only the leader can transfer ownership' }, { status: 403 })

  let payload: { new_leader_id?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.new_leader_id) {
    return NextResponse.json({ error: 'new_leader_id is required' }, { status: 400 })
  }

  const targetRole = await getWorkspaceRole(payload.new_leader_id, id, admin)
  if (!targetRole) {
    return NextResponse.json({ error: 'Target user is not a member of this workspace' }, { status: 400 })
  }

  const { data: workspace } = await admin
    .from('workspaces')
    .select('team_id')
    .eq('id', id)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  await admin.from('team_members')
    .update({ role: 'member' })
    .eq('workspace_id', id)
    .eq('user_id', user.id)

  await admin.from('team_members')
    .update({ role: 'leader' })
    .eq('workspace_id', id)
    .eq('user_id', payload.new_leader_id)

  await admin.from('teams')
    .update({ leader_id: payload.new_leader_id })
    .eq('id', workspace.team_id)

  await logWorkspaceActivity(id, user.id, 'LEADER_TRANSFERRED', `Leadership transferred to user ${payload.new_leader_id}.`, { new_leader_id: payload.new_leader_id, old_leader_id: user.id })

  return NextResponse.json({ ok: true, message: 'Leadership transferred successfully.' })
}
