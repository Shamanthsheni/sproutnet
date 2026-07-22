import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity } from '@/lib/workspace/activity'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  const { id, channelId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canDelete = await checkWorkspacePermission(user.id, id, 'workspace.delete_channel', admin)
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: channel } = await admin
    .from('conversations')
    .select('name')
    .eq('id', channelId)
    .eq('workspace_id', id)
    .single()

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  if (channel.name === 'general') {
    return NextResponse.json({ error: 'The general channel cannot be deleted.' }, { status: 400 })
  }

  await logWorkspaceActivity(id, user.id, 'CHANNEL_DELETED', `Channel "#${channel.name}" deleted.`, { channel_id: channelId })

  const { error } = await admin
    .from('conversations')
    .delete()
    .eq('id', channelId)
    .eq('workspace_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
