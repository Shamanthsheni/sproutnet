import { createAdminClient } from '@/lib/supabase/admin'

export const MAX_ACTIVE_ENROLLMENTS = 2

type SubmissionCompletionRow = {
  problem_id: string | null
  milestone: number | null
  problems?: { milestones: number | null } | { milestones: number | null }[] | null
}

function getProblemMilestones(
  problem:
    | { milestones: number | null }
    | { milestones: number | null }[]
    | null
    | undefined
) {
  if (!problem) return null
  return Array.isArray(problem) ? (problem[0]?.milestones ?? null) : (problem.milestones ?? null)
}

export function getCompletedProblemIds(rows: SubmissionCompletionRow[]) {
  const completed = new Set<string>()

  for (const row of rows) {
    const problemId = row.problem_id
    const totalMilestones = getProblemMilestones(row.problems)

    if (!problemId || !row.milestone || !totalMilestones) continue
    if (row.milestone >= totalMilestones) {
      completed.add(problemId)
    }
  }

  return Array.from(completed)
}

export async function syncCompletedEnrollments(
  admin: ReturnType<typeof createAdminClient>,
  studentId: string
) {
  const { data, error } = await admin
    .from('submissions')
    .select('problem_id, milestone, problems(milestones)')
    .eq('student_id', studentId)
    .eq('stage', 'full')

  if (error || !data) {
    return []
  }

  const completedProblemIds = getCompletedProblemIds(data as SubmissionCompletionRow[])

  if (completedProblemIds.length > 0) {
    await admin
      .from('enrollments')
      .update({ status: 'completed' })
      .eq('student_id', studentId)
      .eq('status', 'active')
      .in('problem_id', completedProblemIds)
  }

  return completedProblemIds
}
