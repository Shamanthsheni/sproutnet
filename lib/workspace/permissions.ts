import { createAdminClient } from '@/lib/supabase/admin'

export type WorkspaceRole = 'leader' | 'co_leader' | 'member' | 'mentor' | 'poster' | 'admin'

export async function getWorkspaceRole(
  userId: string,
  workspaceId: string,
  admin?: ReturnType<typeof createAdminClient>
): Promise<WorkspaceRole | null> {
  const db = admin || createAdminClient()

  const { data: member } = await db
    .from('team_members')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (member) return member.role as WorkspaceRole

  const { data: mentor } = await db
    .from('mentor_assignments')
    .select('mentor_id, teams!inner(id, workspaces!inner(id))')
    .eq('mentor_id', userId)
    .eq('assignment_status', 'active')
    .eq('teams.workspaces.id', workspaceId)
    .maybeSingle()

  if (mentor) return 'mentor'

  const { data: user } = await db
    .from('users')
    .select('role, is_master')
    .eq('id', userId)
    .single()

  if (user?.role === 'admin' || user?.is_master) return 'admin'

  return null
}

export async function checkWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: string,
  admin?: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  const db = admin || createAdminClient()

  const role = await getWorkspaceRole(userId, workspaceId, db)
  if (!role) return false

  const { data: user } = await db
    .from('users')
    .select('role, is_master')
    .eq('id', userId)
    .single()

  if (user?.role === 'admin' || user?.is_master) return true

  const { data: roleRow } = await db
    .from('workspace_roles')
    .select('id')
    .eq('name', role)
    .single()

  if (!roleRow) return false

  const { data: permRows } = await db
    .from('workspace_role_permissions')
    .select('permission')
    .eq('role_id', roleRow.id)

  if (!permRows) return false

  return permRows.some(p => p.permission === '*' || p.permission === permission)
}

export async function requireWorkspaceAccess(
  userId: string,
  workspaceId: string,
  admin?: ReturnType<typeof createAdminClient>
): Promise<WorkspaceRole | null> {
  const role = await getWorkspaceRole(userId, workspaceId, admin)
  return role
}

export async function requireWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: string,
  admin?: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  return checkWorkspacePermission(userId, workspaceId, permission, admin)
}
