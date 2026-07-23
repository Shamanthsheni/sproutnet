import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logWorkspaceActivity } from '@/lib/workspace/activity'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let payload: { invite_code?: string; workspace_id?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  let query = admin
    .from('workspace_invites')
    .select('*, workspaces(id, team_id, name)')
    .eq('status', 'pending')
    .eq('email', profile.email)

  if (payload.invite_code) {
    query = query.eq('id', payload.invite_code)
  } else if (payload.workspace_id) {
    query = query.eq('workspace_id', payload.workspace_id)
  } else {
    return NextResponse.json({ error: 'Provide invite_code or workspace_id' }, { status: 422 })
  }

  const { data: invites } = await query

  if (!invites || invites.length === 0) {
    return NextResponse.json({ error: 'No pending invite found for your email.' }, { status: 404 })
  }

  const invite = invites[0]

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await admin.from('workspace_invites').update({ status: 'expired' }).eq('id', invite.id)
    return NextResponse.json({ error: 'Invite has expired.' }, { status: 400 })
  }

  const ws = invite.workspaces
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { error: memberErr } = await admin
    .from('team_members')
    .insert({
      team_id: ws.team_id,
      workspace_id: ws.id,
      user_id: user.id,
      role: invite.role,
    })

  if (memberErr) {
    if (memberErr.code === '23505') {
      return NextResponse.json({ error: 'You are already a member of this workspace.' }, { status: 400 })
    }
    return NextResponse.json({ error: memberErr.message }, { status: 400 })
  }

  await admin.from('workspace_invites').update({ status: 'accepted' }).eq('id', invite.id)

  const { data: channel } = await admin
    .from('conversations')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('type', 'channel')
    .maybeSingle()

  if (channel) {
    await admin.from('conversation_members').upsert({
      conversation_id: channel.id,
      user_id: user.id,
    }, { onConflict: 'conversation_id, user_id' })
  }

  await logWorkspaceActivity(ws.id, user.id, 'MEMBER_JOINED', 'Member joined via workspace invite.', { invited_user_id: user.id })

  return NextResponse.json({ ok: true, workspace_id: ws.id, workspace_name: ws.name })
}
