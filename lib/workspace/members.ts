import { createAdminClient } from '@/lib/supabase/admin'
import { logWorkspaceActivity } from './activity'

export async function addMember(
  workspaceId: string,
  teamId: string,
  userId: string,
  role: 'leader' | 'co_leader' | 'member' | 'poster' = 'member',
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { data, error } = await db
    .from('team_members')
    .insert({
      team_id: teamId,
      workspace_id: workspaceId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function removeMember(
  workspaceId: string,
  userId: string,
  actorId: string,
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { error } = await db
    .from('team_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  await logWorkspaceActivity(workspaceId, actorId, 'MEMBER_REMOVED', `Member ${userId} was removed from workspace.`, { removed_user_id: userId })

  return true
}

export async function changeMemberRole(
  workspaceId: string,
  userId: string,
  newRole: string,
  actorId: string,
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { data, error } = await db
    .from('team_members')
    .update({ role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logWorkspaceActivity(workspaceId, actorId, 'MEMBER_ROLE_CHANGED', `Member ${userId} role changed to ${newRole}.`, { target_user_id: userId, new_role: newRole })

  return data
}

export async function getWorkspaceMembers(
  workspaceId: string,
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { data, error } = await db
    .from('team_members')
    .select('id, role, joined_at, user_id, users(id, name, email, profile_slug)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return data || []
}

export async function getWorkspaceMemberCount(
  workspaceId: string,
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { count } = await db
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  return count || 0
}
