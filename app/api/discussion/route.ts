import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const problemId = req.nextUrl.searchParams.get('problem_id')
  if (!problemId) {
    return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: comments, error } = await admin
    .from('discussion')
    .select('id, body, created_at, author_id, parent_id, likes_count, users(name, role)')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: comments ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { problem_id?: string; body?: string; parent_id?: string | null }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const problemId = payload.problem_id?.trim()
  const body = payload.body?.trim()
  const parentId = payload.parent_id?.trim() || null

  if (!problemId) {
    return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 })
  }
  if (!body) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('discussion')
    .insert({
      problem_id: problemId,
      author_id: user.id,
      body,
      parent_id: parentId,
    })
    .select('id, body, created_at, author_id, parent_id, likes_count, users(name, role)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}
