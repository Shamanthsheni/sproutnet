import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type ProblemInput } from '@/lib/problem-evaluator'
import { evaluateProblemWithAI } from '@/lib/ai-evaluator'

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

  let body: { problem_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (!body.problem_id) {
    return NextResponse.json({ error: 'problem_id is required' }, { status: 422 })
  }

  const admin = createAdminClient()

  const { data: problem, error: fetchError } = await admin
    .from('problems')
    .select('*')
    .eq('id', body.problem_id)
    .single()

  if (fetchError || !problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
  }

  const input: ProblemInput = {
    title: problem.title ?? '',
    domain: problem.domain ?? '',
    problem_type: problem.problem_type ?? '',
    context: problem.context ?? '',
    problem_stmt: problem.problem_stmt ?? '',
    scope: problem.scope ?? '',
    constraints: problem.constraints ?? '',
    deliverables: problem.deliverables ?? '',
    milestones: problem.milestones ?? 1,
    deadline: problem.deadline ?? '',
    team_mode: problem.team_mode,
    min_team_size: problem.min_team_size,
    max_team_size: problem.max_team_size,
    mentor_required: problem.mentor_required,
  }

  const evaluation = await evaluateProblemWithAI(input)

  const { error: updateError } = await admin
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
    .eq('id', body.problem_id)

  if (updateError) {
    console.error('Evaluation update failed:', updateError.message)
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, evaluation })
}
