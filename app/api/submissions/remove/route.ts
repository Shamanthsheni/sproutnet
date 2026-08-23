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

  let payload: { submission_id?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const submissionId = payload.submission_id?.trim()
  if (!submissionId) {
    return NextResponse.json({ error: 'Missing submission_id.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('submissions')
    .select('id, student_id')
    .eq('id', submissionId)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }

  const { error } = await admin
    .from('submissions')
    .delete()
    .eq('id', submissionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Keep the leaderboard consistent after removal.
  if (sub.student_id) {
    await syncStudentToLeaderboard(sub.student_id)
  }

  return NextResponse.json({ ok: true })
}
