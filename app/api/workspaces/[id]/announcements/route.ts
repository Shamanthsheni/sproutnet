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

  const canRead = await checkWorkspacePermission(user.id, id, 'workspace.read', admin)
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await admin
    .from('workspace_announcements')
    .select('*, author:author_id(id, name, email)')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const active = (data || []).filter(a => !a.expires_at || new Date(a.expires_at) > new Date())

  return NextResponse.json({ announcements: active })
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

  const canPost = await checkWorkspacePermission(user.id, id, 'workspace.post_announcement', admin)
  if (!canPost) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { title?: string; content?: string; announcement_type?: string; is_pinned?: boolean; expires_at?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.title || !payload.title.trim() || !payload.content || !payload.content.trim()) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 422 })
  }

  const validTypes = ['general', 'poster', 'system', 'deadline']
  const announcementType = payload.announcement_type && validTypes.includes(payload.announcement_type)
    ? payload.announcement_type
    : 'general'

  const { data, error } = await admin
    .from('workspace_announcements')
    .insert({
      workspace_id: id,
      author_id: user.id,
      title: payload.title.trim(),
      content: payload.content.trim(),
      announcement_type: announcementType,
      is_pinned: payload.is_pinned || false,
      expires_at: payload.expires_at || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logWorkspaceActivity(id, user.id, 'ANNOUNCEMENT_POSTED', `Announcement: "${data.title}"`, { announcement_id: data.id })

  return NextResponse.json({ announcement: data })
}
