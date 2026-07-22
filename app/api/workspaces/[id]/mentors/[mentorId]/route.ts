import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity } from '@/lib/workspace/activity'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> }
) {
  const { id, mentorId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canRemove = await checkWorkspacePermission(user.id, id, 'workspace.remove_mentor', admin)
  if (!canRemove) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: workspace } = await admin
    .from('workspaces')
    .select('team_id')
    .eq('id', id)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { error: updateErr } = await admin
    .from('mentor_assignments')
    .update({
      assignment_status: 'ended',
      ended_at: new Date().toISOString(),
      ended_reason: 'removed_by_leader',
    })
    .eq('team_id', workspace.team_id)
    .eq('mentor_id', mentorId)
    .eq('assignment_status', 'active')

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  await logWorkspaceActivity(id, user.id, 'MENTOR_REMOVED', `Mentor ${mentorId} removed from workspace.`, { mentor_id: mentorId })

  return NextResponse.json({ ok: true })
}
