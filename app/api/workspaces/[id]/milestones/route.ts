import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity } from '@/lib/workspace/activity'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canRead = await checkWorkspacePermission(user.id, id, 'workspace.read_milestones', admin)
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await admin
    .from('workspace_milestones')
    .select('*, completed_by_user:completed_by(id, name, email), created_by_user:created_by(id, name, email)')
    .eq('workspace_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ milestones: data || [] })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canCreate = await checkWorkspacePermission(user.id, id, 'workspace.create_milestone', admin)
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { title?: string; description?: string; due_date?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.title || !payload.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 422 })
  }

  const { data, error } = await admin
    .from('workspace_milestones')
    .insert({
      workspace_id: id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      due_date: payload.due_date || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logWorkspaceActivity(id, user.id, 'MILESTONE_CREATED', `Milestone "${data.title}" created.`, { milestone_id: data.id })

  return NextResponse.json({ milestone: data })
}
