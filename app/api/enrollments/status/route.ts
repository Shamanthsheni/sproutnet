import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MAX_ACTIVE_ENROLLMENTS,
  getCompletedProblemIds,
  syncCompletedEnrollments,
} from '@/lib/enrollment-progress'

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

  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: { problem_id?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const problemId = payload?.problem_id
  if (!problemId) {
    return NextResponse.json({ error: 'Missing problem_id' }, { status: 400 })
  }

  const admin = createAdminClient()
  await syncCompletedEnrollments(admin, user.id)

  const [{ data: enrollment }, { data: submission }, { count: activeEnrollmentCount }] = await Promise.all([
    admin
      .from('enrollments')
      .select('id, status')
      .eq('problem_id', problemId)
      .eq('student_id', user.id)
      .limit(1),
    admin
      .from('submissions')
      .select('id, problem_id, milestone, problems(milestones)')
      .eq('problem_id', problemId)
      .eq('student_id', user.id),
    admin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('status', 'active'),
  ])

  const enrollmentStatus = enrollment?.[0]?.status ?? null
  const completedProblemIds = getCompletedProblemIds((submission ?? []) as Array<{
    problem_id: string | null
    milestone: number | null
    problems?: { milestones: number | null } | { milestones: number | null }[] | null
  }>)
  const isCompleted = enrollmentStatus === 'completed' || completedProblemIds.includes(problemId)

  return NextResponse.json({
    enrolled: enrollmentStatus === 'active',
    hasSubmitted: (submission?.length ?? 0) > 0,
    completed: isCompleted,
    activeEnrollmentCount: activeEnrollmentCount ?? 0,
    maxActiveEnrollments: MAX_ACTIVE_ENROLLMENTS,
  })
}
