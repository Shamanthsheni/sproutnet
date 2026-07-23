import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
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

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: students } = await admin
    .from('users')
    .select('id, name, dept, year, profile_slug, builder_score, attempted, avg_score, milestones_done')
    .eq('role', 'student')

  if (!students || students.length === 0) {
    return NextResponse.json({ ok: true, message: 'No students found', recalculated: [] })
  }

  const { data: submissions } = await admin
    .from('submissions')
    .select('student_id, problem_id, milestone, status')
    .eq('status', 'judged')

  const { data: problems } = await admin
    .from('problems')
    .select('id, difficulty_score, leaderboard_weight')

  const weightMap = new Map<string, number>()
  for (const p of (problems ?? []) as Array<{ id: string; difficulty_score: number | null; leaderboard_weight: number | null }>) {
    weightMap.set(p.id, p.leaderboard_weight ?? 1.0)
  }

  const submissionCounts = new Map<string, { attempted: number; milestones_done: number; totalWeight: number }>()
  for (const sub of (submissions ?? []) as Array<{ student_id: string; problem_id: string; milestone: number; status: string }>) {
    const entry = submissionCounts.get(sub.student_id) ?? { attempted: 0, milestones_done: 0, totalWeight: 0 }
    if (sub.milestone === 1) entry.attempted += 1
    entry.milestones_done += 1
    entry.totalWeight += weightMap.get(sub.problem_id) ?? 1.0
    submissionCounts.set(sub.student_id, entry)
  }

  const recalculated: Array<{
    name: string
    dept: string | null
    year: string | null
    profile_slug: string | null
    old_score: number | null
    new_score: number
    attempted: number
    milestones_done: number
    avg_weight: number
    formula: string
  }> = []

  for (const student of students as Array<{ id: string; name: string; dept: string | null; year: string | null; profile_slug: string | null; builder_score: number | null; attempted: number | null; avg_score: number | null; milestones_done: number | null }>) {
    const counts = submissionCounts.get(student.id)
    const attempted = counts?.attempted ?? 0
    const milestonesDone = counts?.milestones_done ?? 0
    const totalWeight = counts?.totalWeight ?? 0
    const avgWeight = milestonesDone > 0 ? Math.round((totalWeight / milestonesDone) * 100) / 100 : 1.0
    const avgScore = student.avg_score ?? 5.0

    const depth = Math.max(1, milestonesDone)
    const solutionsCompleted = Math.max(1, attempted)
    const newScore = Math.round(avgScore * depth * solutionsCompleted * avgWeight * 10) / 10

    const formula = `${avgScore} (avg) × ${depth} (depth) × ${solutionsCompleted} (solved) × ${avgWeight} (avg weight) = ${newScore}`

    recalculated.push({
      name: student.name,
      dept: student.dept,
      year: student.year,
      profile_slug: student.profile_slug,
      old_score: student.builder_score,
      new_score: newScore,
      attempted,
      milestones_done: milestonesDone,
      avg_weight: avgWeight,
      formula,
    })
  }

  recalculated.sort((a, b) => b.new_score - a.new_score)

  return NextResponse.json({
    ok: true,
    message: `Recalculated ${recalculated.length} student(s)`,
    formula: 'Builder Score = avg score × depth × solutions completed × average leaderboard weight',
    recalculated: recalculated.slice(0, 20),
  })
}
