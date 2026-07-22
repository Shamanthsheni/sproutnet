import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity } from '@/lib/workspace/activity'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  const { id, announcementId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canDelete = await checkWorkspacePermission(user.id, id, 'workspace.delete_announcement', admin)
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: announcement } = await admin
    .from('workspace_announcements')
    .select('title')
    .eq('id', announcementId)
    .eq('workspace_id', id)
    .single()

  if (!announcement) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })

  const { error } = await admin
    .from('workspace_announcements')
    .delete()
    .eq('id', announcementId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logWorkspaceActivity(id, user.id, 'ANNOUNCEMENT_DELETED', `Announcement "${announcement.title}" removed.`, { announcement_id: announcementId })

  return NextResponse.json({ ok: true })
}
