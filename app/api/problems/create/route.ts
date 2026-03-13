import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  decodeProblemThumbnailFallback,
  encodeProblemThumbnailFallback,
  isMissingProblemThumbnailColumnError,
  normalizeProblemThumbnailUrl,
} from '@/lib/problem-thumbnail'

type ProblemPayload = {
  title: string
  domain: string
  problem_type: string
  status?: string
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

  const missing: string[] = []
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

  if (
    typeof payload?.deadline === 'string' &&
    typeof payload?.judging_deadline === 'string' &&
    payload.judging_deadline < payload.deadline
  ) {
    return NextResponse.json(
      { error: 'Judging deadline must be on or after the submission deadline.' },
      { status: 422 }
    )
  }

  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing or invalid fields: ${missing.join(', ')}` }, { status: 422 })
  }

  const thumbnailUrl = payload.thumbnail_url == null
    ? null
    : normalizeProblemThumbnailUrl(payload.thumbnail_url)

  if (payload.thumbnail_url != null && !thumbnailUrl) {
    return NextResponse.json({ error: 'Invalid thumbnail_url' }, { status: 422 })
  }

  const admin = createAdminClient()
  const insertData = {
    title: payload.title,
    domain: payload.domain,
    problem_type: payload.problem_type,
    status: payload.status ?? 'open',
    reward_amount: payload.reward_amount ?? null,
    thumbnail_url: thumbnailUrl,
    milestones,
    deadline: payload.deadline,
    judging_deadline: payload.judging_deadline,
    context: payload.context,
    problem_stmt: payload.problem_stmt,
    scope: payload.scope,
    constraints: payload.constraints,
    deliverables: payload.deliverables,
    poster_id: user.id,
  }

  let warning: string | null = null
  let { error } = await admin
    .from('problems')
    .insert(insertData)

  if (error && isMissingProblemThumbnailColumnError(error.message)) {
    const fallbackInsertData = { ...insertData }
    delete fallbackInsertData.thumbnail_url
    fallbackInsertData.rejected_reason = encodeProblemThumbnailFallback(thumbnailUrl)
    const retry = await admin.from('problems').insert(fallbackInsertData)
    error = retry.error

    if (!error && thumbnailUrl && decodeProblemThumbnailFallback(fallbackInsertData.rejected_reason) === thumbnailUrl) {
      warning = 'Problem saved using temporary thumbnail storage because the database migration has not been applied yet.'
    }
  }

  if (error) {
    console.error('Problem insert failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details, hint: error.hint },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, warning })
}
