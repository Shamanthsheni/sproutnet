import { createAdminClient } from '@/lib/supabase/admin'

export async function sendWorkspaceNotification(
  userId: string,
  eventType: string,
  title: string,
  body: string,
  linkUrl?: string,
  metadata: Record<string, unknown> = {},
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { error } = await db.from('notifications').insert({
    user_id: userId,
    event_type: eventType,
    title,
    body,
    link_url: linkUrl || null,
    metadata,
  })

  if (error) {
    console.error('Failed to send notification:', error.message)
  }
}

export async function notifyWorkspaceMembers(
  workspaceId: string,
  eventType: string,
  title: string,
  body: string,
  linkUrl?: string,
  excludeUserId?: string,
  metadata: Record<string, unknown> = {},
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { data: members } = await db
    .from('team_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)

  if (!members) return

  const notifications = members
    .filter(m => m.user_id !== excludeUserId)
    .map(m => ({
      user_id: m.user_id,
      event_type: eventType,
      title,
      body,
      link_url: linkUrl || null,
      metadata: { ...metadata, workspace_id: workspaceId },
    }))

  if (notifications.length > 0) {
    const { error } = await db.from('notifications').insert(notifications)
    if (error) {
      console.error('Failed to notify workspace members:', error.message)
    }
  }
}
