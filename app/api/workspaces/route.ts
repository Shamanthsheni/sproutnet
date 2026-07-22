import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await admin
    .from('users')
    .select('role, is_master')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.is_master

  let workspaceIds: string[] = []

  if (isAdmin) {
    const { data } = await admin
      .from('workspaces')
      .select('id')
      .order('last_activity_at', { ascending: false })

    workspaceIds = (data || []).map(r => r.id).filter(Boolean)
  } else {
    const { data: memberRows } = await admin
      .from('team_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .not('workspace_id', 'is', null)

    workspaceIds = [...new Set((memberRows || []).map(r => r.workspace_id).filter(Boolean))]

    const { data: mentorRows } = await admin
      .from('mentor_assignments')
      .select('teams!inner(id, workspaces!inner(id))')
      .eq('mentor_id', user.id)
      .eq('assignment_status', 'active')

    for (const row of mentorRows || []) {
      const mentorRow = row as { teams?: { workspaces?: { id?: string } } }
      const wsId = mentorRow.teams?.workspaces?.id
      if (wsId) workspaceIds.push(wsId)
    }
  }

  const workspaceRows: Record<string, unknown>[] = []
  if (workspaceIds.length > 0) {
    const { data } = await admin
      .from('workspaces')
      .select('*, teams(id, name, problem_id, problems(title, domain)), team_members(count)')
      .in('id', workspaceIds)
      .order('last_activity_at', { ascending: false })

    workspaceRows.push(...(data || []))
  }

  const enriched = await Promise.all(workspaceRows.map(async (ws) => {
    const { count: memberCount } = await admin
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', ws.id)

    return {
      ...ws,
      member_count: memberCount || 0,
    }
  }))

  return NextResponse.json({ workspaces: enriched })
}
