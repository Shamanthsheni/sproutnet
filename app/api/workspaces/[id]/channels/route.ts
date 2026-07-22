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
    .from('conversations')
    .select('id, name, type, description, is_private, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ channels: data || [] })
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

  const canCreate = await checkWorkspacePermission(user.id, id, 'workspace.create_channel', admin)
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { name?: string; description?: string; is_private?: boolean }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.name || !payload.name.trim()) {
    return NextResponse.json({ error: 'Channel name is required' }, { status: 422 })
  }

  const channelName = payload.name.trim().toLowerCase().replace(/\s+/g, '-')

  const { data, error } = await admin
    .from('conversations')
    .insert({
      workspace_id: id,
      type: 'channel',
      name: channelName,
      description: payload.description?.trim() || null,
      is_private: payload.is_private || false,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A channel with this name already exists.' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: workspace } = await admin
    .from('workspaces')
    .select('team_id')
    .eq('id', id)
    .single()

  if (workspace) {
    const { data: members } = await admin
      .from('team_members')
      .select('user_id')
      .eq('workspace_id', id)

    if (members) {
      const memberEntries = members.map(m => ({
        conversation_id: data.id,
        user_id: m.user_id,
      }))

      try {
        await admin.from('conversation_members').insert(memberEntries)
      } catch {} // Non-critical; members may already exist
    }
  }

  await logWorkspaceActivity(id, user.id, 'CHANNEL_CREATED', `Channel "#${channelName}" created.`, { channel_id: data.id })

  return NextResponse.json({ channel: data })
}
