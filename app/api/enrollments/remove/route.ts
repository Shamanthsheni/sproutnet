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

  if (!profile || (profile.role !== 'poster' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: { enrollment_id?: string; problem_id?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const enrollmentId = payload?.enrollment_id
  const problemId = payload?.problem_id
  if (!enrollmentId || !problemId) {
    return NextResponse.json({ error: 'Missing enrollment_id or problem_id' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: problem } = await admin
    .from('problems')
    .select('poster_id')
    .eq('id', problemId)
    .single()

  if (!problem || (profile.role === 'poster' && problem.poster_id !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await admin
    .from('enrollments')
    .update({ status: 'removed' })
    .eq('id', enrollmentId)
    .eq('problem_id', problemId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
