import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  const [{ data: enrollment }, { data: submission }] = await Promise.all([
    admin
      .from('enrollments')
      .select('id')
      .eq('problem_id', problemId)
      .eq('student_id', user.id)
      .eq('status', 'active')
      .limit(1),
    admin
      .from('submissions')
      .select('id')
      .eq('problem_id', problemId)
      .eq('student_id', user.id)
      .limit(1),
  ])

  return NextResponse.json({
    enrolled: (enrollment?.length ?? 0) > 0,
    hasSubmitted: (submission?.length ?? 0) > 0,
  })
}
