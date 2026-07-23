import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkWorkspacePermission } from '@/lib/workspace/permissions'
import { getWorkspaceProgress, upsertWorkspaceProgress } from '@/lib/workspace/progress'
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

  try {
    const progress = await getWorkspaceProgress(id, admin)
    return NextResponse.json({ progress })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get progress'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canManage = await checkWorkspacePermission(user.id, id, 'workspace.manage_progress', admin)
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: { current_stage?: string; reviewer_feedback?: string; poster_feedback?: string; progress_percentage?: number }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validStages = ['ideation', 'planning', 'development', 'testing', 'submission', 'reviewed']
  if (payload.current_stage && !validStages.includes(payload.current_stage)) {
    return NextResponse.json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` }, { status: 422 })
  }

  const updates: Record<string, unknown> = {}
  if (payload.current_stage) updates.current_stage = payload.current_stage
  if (payload.reviewer_feedback !== undefined) updates.reviewer_feedback = payload.reviewer_feedback
  if (payload.poster_feedback !== undefined) updates.poster_feedback = payload.poster_feedback
  if (payload.progress_percentage !== undefined) updates.progress_percentage = payload.progress_percentage

  try {
    const progress = await upsertWorkspaceProgress(id, updates, admin)
    await logWorkspaceActivity(id, user.id, 'PROGRESS_UPDATED', 'Workspace progress was updated.', { updates })
    return NextResponse.json({ progress })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update progress'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
