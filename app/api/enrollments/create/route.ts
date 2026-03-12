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
  const { data: existing } = await admin
    .from('enrollments')
    .select('id, status')
    .eq('problem_id', problemId)
    .eq('student_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    const status = existing[0]?.status
    if (status === 'removed') {
      return NextResponse.json({ error: 'Enrollment removed by poster.' }, { status: 403 })
    }
    return NextResponse.json({ ok: true })
  }

  const { error } = await admin
    .from('enrollments')
    .insert({ problem_id: problemId, student_id: user.id, status: 'active' })

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details, hint: error.hint },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
