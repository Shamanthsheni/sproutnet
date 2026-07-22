import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { changeMemberRole, removeMember } from '@/lib/workspace/members'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasPerm = await checkWorkspacePermission(user.id, id, 'workspace.manage_roles', admin)
  if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { role?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.role || !['leader', 'co_leader', 'member'].includes(payload.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  try {
    const updated = await changeMemberRole(id, userId, payload.role, user.id, admin)
    return NextResponse.json({ member: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update role'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isSelf = userId === user.id
  const hasPerm = await checkWorkspacePermission(user.id, id, 'workspace.remove_member', admin)

  if (!isSelf && !hasPerm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await removeMember(id, userId, user.id, admin)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove member'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
