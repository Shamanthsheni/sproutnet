import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity } from '@/lib/workspace/activity'
import { calculateProgressFromMilestones, upsertWorkspaceProgress } from '@/lib/workspace/progress'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id, milestoneId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canUpdate = await checkWorkspacePermission(user.id, id, 'workspace.update_milestone', admin)
  if (!canUpdate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { title?: string; description?: string; status?: string; due_date?: string | null }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = ['title', 'description', 'status', 'due_date']
  const updates: Record<string, unknown> = {}

  for (const key of allowed) {
    if (payload[key as keyof typeof payload] !== undefined) {
      updates[key] = payload[key as keyof typeof payload]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  if (updates.status === 'completed') {
    updates.completed_by = user.id
    updates.completed_at = new Date().toISOString()
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await admin
    .from('workspace_milestones')
    .update(updates)
    .eq('id', milestoneId)
    .eq('workspace_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logWorkspaceActivity(id, user.id, 'MILESTONE_UPDATED', `Milestone "${data.title}" updated.`, { milestone_id: milestoneId, updates })

  const progress = await calculateProgressFromMilestones(id, admin)
  await upsertWorkspaceProgress(id, { progress_percentage: progress }, admin)

  return NextResponse.json({ milestone: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id, milestoneId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canDelete = await checkWorkspacePermission(user.id, id, 'workspace.delete_milestone', admin)
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: milestone } = await admin
    .from('workspace_milestones')
    .select('title')
    .eq('id', milestoneId)
    .eq('workspace_id', id)
    .single()

  if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })

  const { error } = await admin
    .from('workspace_milestones')
    .delete()
    .eq('id', milestoneId)
    .eq('workspace_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logWorkspaceActivity(id, user.id, 'MILESTONE_DELETED', `Milestone "${milestone.title}" deleted.`, { milestone_id: milestoneId })

  const progress = await calculateProgressFromMilestones(id, admin)
  await upsertWorkspaceProgress(id, { progress_percentage: progress }, admin)

  return NextResponse.json({ ok: true })
}
