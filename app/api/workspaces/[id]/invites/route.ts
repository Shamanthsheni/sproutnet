import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { logWorkspaceActivity } from '@/lib/workspace/activity'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canInvite = await checkWorkspacePermission(user.id, id, 'workspace.invite', admin)
  if (!canInvite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { email?: string; role?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.email || !payload.email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 422 })
  }

  const inviteRole = payload.role === 'co_leader' ? 'co_leader' : 'member'

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await admin
    .from('workspace_invites')
    .insert({
      workspace_id: id,
      invited_by: user.id,
      email: payload.email.trim().toLowerCase(),
      role: inviteRole,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An active invite already exists for this email.' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await logWorkspaceActivity(id, user.id, 'INVITE_SENT', `Invite sent to ${payload.email}.`, { invited_email: payload.email, role: inviteRole })

  return NextResponse.json({ invite: data })
}
