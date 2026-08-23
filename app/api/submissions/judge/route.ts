import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncStudentToLeaderboard } from '@/lib/leaderboard-sync'

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

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { submission_id, score, feedback, decision } = await req.json() as {
    submission_id: string
    score: number
    feedback?: string
    decision?: 'approve' | 'reject'
  }

  if (!submission_id || score == null || score < 0 || score > 10) {
    return NextResponse.json({ error: 'Invalid input. score must be 0-10.' }, { status: 400 })
  }

  const finalStatus = decision === 'reject' ? 'rejected' : 'approved'

  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('submissions')
    .select('id, student_id, status')
    .eq('id', submission_id)
    .single()

  if (!sub) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (sub.status === 'judged' || sub.status === 'approved' || sub.status === 'rejected') {
    return NextResponse.json({ error: 'Already judged' }, { status: 409 })
  }

  const { error: updateError } = await admin
    .from('submissions')
    .update({
      status: finalStatus,
      score,
      judge_feedback: feedback ?? null,
    })
    .eq('id', submission_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await syncStudentToLeaderboard(sub.student_id)

  return NextResponse.json({ ok: true, score, student_id: sub.student_id })
}
