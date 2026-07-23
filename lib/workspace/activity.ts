import { createAdminClient } from '@/lib/supabase/admin'

export async function logWorkspaceActivity(
  workspaceId: string,
  actorId: string,
  actionType: string,
  description: string,
  metadata: Record<string, unknown> = {},
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { error } = await db.from('activity_logs').insert({
    workspace_id: workspaceId,
    actor_id: actorId,
    action_type: actionType,
    description,
    metadata,
  })

  if (error) {
    console.error('Failed to log workspace activity:', error.message)
  }

  await db.from('workspaces').update({ last_activity_at: new Date().toISOString() }).eq('id', workspaceId)
}

export async function logAuditEvent(
  actorId: string,
  actionType: string,
  entityType: string,
  entityId: string | null,
  description: string,
  metadata: Record<string, unknown> = {},
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  await db.from('audit_logs').insert({
    actor_id: actorId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    description,
    metadata,
  })
}
