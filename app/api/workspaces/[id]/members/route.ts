import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceRole } from '@/lib/workspace/permissions'
import { getWorkspaceMembers } from '@/lib/workspace/members'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getWorkspaceRole(user.id, id, admin)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const members = await getWorkspaceMembers(id, admin)

  return NextResponse.json({ members })
}
