import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceRole, checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity, logAuditEvent } from '@/lib/workspace/activity'
import { getWorkspaceMembers } from '@/lib/workspace/members'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getWorkspaceRole(user.id, id, admin)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: workspace } = await admin
    .from('workspaces')
    .select('*, teams(id, name, problem_id, leader_id, status, invite_code, problems(id, title, domain, team_mode, milestones))')
    .eq('id', id)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const members = await getWorkspaceMembers(id, admin)
  const memberCount = members.length

  const { data: mentors } = await admin
    .from('mentor_assignments')
    .select('assigned_at, assignment_status, mentor_id, users(id, name, email), mentor_profiles(*)')
    .eq('team_id', workspace.team_id)
    .eq('assignment_status', 'active')

  const { data: channels } = await admin
    .from('conversations')
    .select('id, name, type, description, is_private, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: true })

  const { data: milestones } = await admin
    .from('workspace_milestones')
    .select('*')
    .eq('workspace_id', id)
    .order('created_at', { ascending: true })

  const { data: announcements } = await admin
    .from('workspace_announcements')
    .select('*')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentActivity } = await admin
    .from('activity_logs')
    .select('*, users:actor_id(name)')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const memberProgress = await admin
    .from('workspace_progress')
    .select('*')
    .eq('workspace_id', id)
    .maybeSingle()
    .then(r => r.data)

  return NextResponse.json({
    workspace,
    members,
    member_count: memberCount,
    mentors: mentors || [],
    channels: channels || [],
    milestones: milestones || [],
    announcements: announcements || [],
    recent_activity: recentActivity || [],
    progress: memberProgress || null,
    current_user_role: role,
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasPerm = await checkWorkspacePermission(user.id, id, 'workspace.update', admin)
  if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = ['name', 'description', 'status', 'visibility', 'max_members', 'max_mentors']
  const updates: Record<string, unknown> = {}

  for (const key of allowed) {
    if (payload[key] !== undefined) {
      updates[key] = payload[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await admin
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logWorkspaceActivity(id, user.id, 'WORKSPACE_UPDATED', 'Workspace settings were updated.', { updates })

  return NextResponse.json({ workspace: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasPerm = await checkWorkspacePermission(user.id, id, 'workspace.delete', admin)
  if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await logAuditEvent(user.id, 'WORKSPACE_DISBANDED', 'workspace', id, 'Workspace was disbanded.', { workspace_id: id }, admin)

  const { error } = await admin
    .from('workspaces')
    .update({ status: 'disbanded', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
