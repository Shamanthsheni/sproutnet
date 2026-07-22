import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceRole } from '@/lib/workspace/permissions'
import { removeMember } from '@/lib/workspace/members'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getWorkspaceRole(user.id, id, admin)
  if (!role) return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 400 })

  if (role === 'leader') {
    return NextResponse.json({ error: 'Leader cannot leave. Transfer leadership first.' }, { status: 400 })
  }

  try {
    await removeMember(id, user.id, user.id, admin)
    return NextResponse.json({ ok: true, message: 'You have left the workspace.' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to leave workspace'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
