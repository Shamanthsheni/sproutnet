import { createAdminClient } from '@/lib/supabase/admin'

export async function getWorkspaceProgress(
  workspaceId: string,
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { data, error } = await db
    .from('workspace_progress')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return data || null
}

export async function upsertWorkspaceProgress(
  workspaceId: string,
  updates: {
    progress_percentage?: number
    current_stage?: string
    reviewer_feedback?: string
    poster_feedback?: string
  },
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }

  const { data, error } = await db
    .from('workspace_progress')
    .upsert(
      { workspace_id: workspaceId, ...payload },
      { onConflict: 'workspace_id' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function calculateProgressFromMilestones(
  workspaceId: string,
  admin?: ReturnType<typeof createAdminClient>
) {
  const db = admin || createAdminClient()

  const { data: milestones, error } = await db
    .from('workspace_milestones')
    .select('status')
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(error.message)

  if (!milestones || milestones.length === 0) return 0

  const completed = milestones.filter(m => m.status === 'completed').length
  return Math.round((completed / milestones.length) * 100)
}
