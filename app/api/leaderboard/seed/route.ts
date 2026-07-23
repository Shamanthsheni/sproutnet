import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const FAKE_STUDENTS = [
  { name: 'Aditya Sharma', dept: 'Computer Science', year: '3rd Year', baseScore: 9.2, attempted: 4, done: 8, badges: ['Expert Solver', 'Multi-Domain'], slug: 'aditya-sharma' },
  { name: 'Priya Patel', dept: 'Information Science', year: '4th Year', baseScore: 8.7, attempted: 4, done: 7, badges: ['Deep Thinker', 'Consistent'], slug: 'priya-patel' },
  { name: 'Rahul Verma', dept: 'Computer Science', year: '3rd Year', baseScore: 8.1, attempted: 3, done: 6, badges: ['Weighted Scorer'], slug: 'rahul-verma' },
  { name: 'Sneha Reddy', dept: 'Electronics', year: '4th Year', baseScore: 7.8, attempted: 3, done: 5, badges: ['First Submission'], slug: 'sneha-reddy' },
  { name: 'Arjun Nair', dept: 'Mechanical', year: '3rd Year', baseScore: 7.2, attempted: 3, done: 5, badges: ['Rising Star'], slug: 'arjun-nair' },
  { name: 'Kavya Iyer', dept: 'Computer Science', year: '2nd Year', baseScore: 6.8, attempted: 2, done: 4, badges: ['Consistent'], slug: 'kavya-iyer' },
  { name: 'Vikram Joshi', dept: 'Information Science', year: '3rd Year', baseScore: 6.3, attempted: 2, done: 3, badges: [], slug: 'vikram-joshi' },
  { name: 'Ananya Gupta', dept: 'Civil Engineering', year: '4th Year', baseScore: 5.7, attempted: 2, done: 3, badges: ['First Submission'], slug: 'ananya-gupta' },
  { name: 'Rohit Singh', dept: 'Electronics', year: '2nd Year', baseScore: 4.9, attempted: 1, done: 2, badges: [], slug: 'rohit-singh' },
  { name: 'Meera Krishnan', dept: 'Mechanical', year: '1st Year', baseScore: 3.8, attempted: 1, done: 1, badges: [], slug: 'meera-krishnan' },
]

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

  const { data: problems } = await admin
    .from('problems')
    .select('id, difficulty_score, leaderboard_weight')
    .limit(10)

  const avgWeight = problems && problems.length > 0
    ? Math.round((problems as Array<{ leaderboard_weight: number | null }>).reduce((s, p) => s + (p.leaderboard_weight ?? 1.0), 0) / problems.length * 100) / 100
    : 1.0

  const leaderboardEntries = FAKE_STUDENTS.map((s, i) => {
    const depth = Math.max(1, s.done)
    const solved = Math.max(1, s.attempted)
    const builderScore = Math.round(s.baseScore * depth * solved * avgWeight * 10) / 10
    return {
      rank: i + 1,
      builder_score: builderScore,
      name: s.name,
      dept: s.dept,
      year: s.year,
      profile_slug: s.slug,
      attempted: s.attempted,
      avg_score: s.baseScore,
      milestones_done: s.done,
      badges: s.badges,
    }
  })

  const { data: existingAdmin } = await admin
    .from('users')
    .select('id, name, dept, year, profile_slug, builder_score, attempted, avg_score, milestones_done')
    .eq('id', user.id)
    .single()

  if (existingAdmin) {
    const adminWeight = avgWeight
    const adminDepth = Math.max(1, existingAdmin.milestones_done ?? 4)
    const adminSolved = Math.max(1, existingAdmin.attempted ?? 4)
    const adminAvg = existingAdmin.avg_score ?? 7.5
    const adminScore = Math.round(adminAvg * adminDepth * adminSolved * adminWeight * 10) / 10

    const adminEntry = {
      rank: -1,
      builder_score: adminScore,
      name: existingAdmin.name ?? 'Admin',
      dept: existingAdmin.dept ?? 'Admin',
      year: existingAdmin.year ?? '—',
      profile_slug: existingAdmin.profile_slug ?? user.id,
      attempted: existingAdmin.attempted ?? 4,
      avg_score: adminAvg,
      milestones_done: existingAdmin.milestones_done ?? 4,
      badges: ['Admin', 'Weighted Scorer'],
    }

    const insertIndex = leaderboardEntries.findIndex(e => adminScore > e.builder_score)
    if (insertIndex >= 0) {
      leaderboardEntries.splice(insertIndex, 0, adminEntry)
    } else {
      leaderboardEntries.push(adminEntry)
    }

    await admin.from('users').update({
      builder_score: adminScore,
      attempted: existingAdmin.attempted ?? 4,
      avg_score: adminAvg,
      milestones_done: existingAdmin.milestones_done ?? 4,
    }).eq('id', user.id)
  }

  await admin.from('leaderboard').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const reindexed = leaderboardEntries.map((e, i) => ({ ...e, rank: i + 1 }))

  const { error: insertError } = await admin
    .from('leaderboard')
    .insert(reindexed)

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    summary: `Seeded ${reindexed.length} leaderboard entries`,
    formula: `Builder Score = avg score × depth × solved × avg weight (${avgWeight})`,
    entries: reindexed.map(e => ({ rank: e.rank, name: e.name, score: e.builder_score, formula: `${e.avg_score} × ${e.milestones_done} × ${e.attempted} × ${avgWeight} = ${e.builder_score}` })),
  })
}
