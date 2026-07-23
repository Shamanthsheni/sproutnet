import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type ProblemInput } from '@/lib/problem-evaluator'
import { evaluateProblemWithAI } from '@/lib/ai-evaluator'
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
  milestones?: number
  deadline: string
  judging_deadline: string
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
  team_mode?: string
  min_team_size?: number
  max_team_size?: number
  mentor_required?: boolean
  max_mentors_per_team?: number
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

  const milestones = payload?.milestones ? Number(payload.milestones) : 1

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
    team_mode: payload.team_mode ?? 'solo',
    min_team_size: payload.min_team_size ?? 1,
    max_team_size: payload.max_team_size ?? 4,
    mentor_required: payload.mentor_required ?? false,
    max_mentors_per_team: payload.max_mentors_per_team ?? 1,
  }

  let warning: string | null = null
  let insertedId: string | null = null
  let insertError: { message: string; code?: string; details?: string; hint?: string } | null = null

  const { data: inserted, error } = await admin
    .from('problems')
    .insert(insertData)
    .select('id')
    .single()

  if (error && isMissingProblemThumbnailColumnError(error.message)) {
    const fallbackInsertData = Object.fromEntries(
      Object.entries(insertData).filter(([key]) => key !== 'thumbnail_url')
    )
    const retryPayload = {
      ...fallbackInsertData,
      rejected_reason: encodeProblemThumbnailFallback(thumbnailUrl),
    }
    const retry = await admin.from('problems').insert(retryPayload).select('id').single()
    insertError = retry.error
    if (!insertError && retry.data) {
      insertedId = retry.data.id
    }

    if (!insertError && thumbnailUrl && decodeProblemThumbnailFallback(retryPayload.rejected_reason) === thumbnailUrl) {
      warning = 'Problem saved using temporary thumbnail storage because the database migration has not been applied yet.'
    }
  } else if (!error && inserted) {
    insertedId = inserted.id
  } else {
    insertError = error
  }

  const displayError = error && !isMissingProblemThumbnailColumnError(error.message) ? error : insertError

  if (displayError) {
    console.error('Problem insert failed:', {
      message: displayError.message,
      code: displayError.code,
      details: displayError.details,
      hint: displayError.hint,
    })
    return NextResponse.json(
      { error: displayError.message, code: displayError.code, details: displayError.details, hint: displayError.hint },
      { status: 400 }
    )
  }

  if (insertedId) {
    try {
      const evalInput: ProblemInput = {
        title: payload.title,
        domain: payload.domain,
        problem_type: payload.problem_type,
        context: payload.context,
        problem_stmt: payload.problem_stmt,
        scope: payload.scope,
        constraints: payload.constraints,
        deliverables: payload.deliverables,
        milestones: payload.milestones ?? 1,
        deadline: payload.deadline,
        team_mode: payload.team_mode,
        min_team_size: payload.min_team_size,
        max_team_size: payload.max_team_size,
        mentor_required: payload.mentor_required,
      }

      const evaluation = await evaluateProblemWithAI(evalInput)

      await admin
        .from('problems')
        .update({
          difficulty_score: evaluation.difficulty_score,
          difficulty_label: evaluation.difficulty,
          leaderboard_weight: evaluation.leaderboard_weight,
          impact_score: evaluation.impact_score,
          estimated_hours: evaluation.estimated_hours,
          estimated_weeks: evaluation.estimated_weeks,
          evaluation_json: evaluation,
          evaluated_at: new Date().toISOString(),
        })
        .eq('id', insertedId)
    } catch (evalErr) {
      console.error('Auto-evaluation failed:', evalErr)
    }
  }

  return NextResponse.json({ ok: true, warning, problem_id: insertedId })
}
