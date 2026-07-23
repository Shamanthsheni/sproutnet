import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceRole } from '@/lib/workspace/permissions'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getWorkspaceRole(user.id, id, admin)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const actionType = url.searchParams.get('action_type')

  let query = admin
    .from('activity_logs')
    .select('*, users:actor_id(name)', { count: 'exact' })
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (actionType) {
    query = query.eq('action_type', actionType)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    activity: data || [],
    total: count || 0,
    limit,
    offset,
  })
}
