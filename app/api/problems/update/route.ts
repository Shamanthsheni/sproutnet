import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  encodeProblemThumbnailFallback,
  isMissingProblemThumbnailColumnError,
  normalizeProblemThumbnailUrl,
} from '@/lib/problem-thumbnail'

type ProblemPayload = {
  id: string
  title: string
  domain: string
  problem_type: string
  thumbnail_url?: string | null
  reward_amount?: number | null
  milestones: number
  deadline: string
  judging_deadline: string
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'poster' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: ProblemPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (!payload?.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const requiredText: Array<keyof ProblemPayload> = [
    'title',
    'domain',
    'problem_type',
    'deadline',
    'judging_deadline',
    'context',
    'problem_stmt',
    'scope',
    'constraints',
    'deliverables',
  ]
  const missing: string[] = []
  for (const key of requiredText) {
    const value = payload?.[key]
    if (typeof value !== 'string' || value.trim().length === 0) {
      missing.push(key)
    }
  }
  const milestones = Number(payload?.milestones)
  if (!Number.isFinite(milestones) || milestones < 1) {
    missing.push('milestones')
  }
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing or invalid fields: ${missing.join(', ')}` }, { status: 422 })
  }
  if (payload.judging_deadline < payload.deadline) {
    return NextResponse.json({ error: 'Judging deadline must be on or after the submission deadline.' }, { status: 422 })
  }

  const shouldUpdateThumbnail = Object.prototype.hasOwnProperty.call(payload, 'thumbnail_url')
  const thumbnailUrl = payload.thumbnail_url == null
    ? null
    : normalizeProblemThumbnailUrl(payload.thumbnail_url)

  if (shouldUpdateThumbnail && payload.thumbnail_url != null && !thumbnailUrl) {
    return NextResponse.json({ error: 'Invalid thumbnail_url' }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data: problem } = await admin
    .from('problems')
    .select('poster_id')
    .eq('id', payload.id)
    .single()

  if (!problem || (profile.role === 'poster' && problem.poster_id !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {
    title: payload.title,
    domain: payload.domain,
    problem_type: payload.problem_type,
    reward_amount: payload.reward_amount ?? null,
    milestones,
    deadline: payload.deadline,
    judging_deadline: payload.judging_deadline,
    context: payload.context,
    problem_stmt: payload.problem_stmt,
    scope: payload.scope,
    constraints: payload.constraints,
    deliverables: payload.deliverables,
  }

  if (shouldUpdateThumbnail) {
    updateData.thumbnail_url = thumbnailUrl
  }

  let warning: string | null = null
  let { error } = await admin
    .from('problems')
    .update(updateData)
    .eq('id', payload.id)

  if (error && shouldUpdateThumbnail && isMissingProblemThumbnailColumnError(error.message)) {
    const fallbackUpdateData = { ...updateData }
    delete fallbackUpdateData.thumbnail_url
    fallbackUpdateData.rejected_reason = encodeProblemThumbnailFallback(thumbnailUrl)
    const retry = await admin
      .from('problems')
      .update(fallbackUpdateData)
      .eq('id', payload.id)

    error = retry.error

    if (!error && thumbnailUrl) {
      warning = 'Problem updated using temporary thumbnail storage because the database migration has not been applied yet.'
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, warning })
}
