import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentId } = await req.json().catch(() => ({}))
  if (!commentId) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 422 })
  }

  // Check if user already liked this comment
  const { data: existingLike } = await admin
    .from('discussion_likes')
    .select('id')
    .eq('discussion_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingLike) {
    // Unlike: remove like and decrement count
    const { data: comment } = await admin
      .from('discussion')
      .select('likes_count')
      .eq('id', commentId)
      .single()

    const newCount = Math.max(0, (comment?.likes_count || 1) - 1)

    await admin
      .from('discussion')
      .update({ likes_count: newCount })
      .eq('id', commentId)

    await admin
      .from('discussion_likes')
      .delete()
      .eq('id', existingLike.id)

    return NextResponse.json({ liked: false, likes_count: newCount })
  } else {
    // Like: add like and increment count
    const { data: comment } = await admin
      .from('discussion')
      .select('likes_count')
      .eq('id', commentId)
      .single()

    const newCount = (comment?.likes_count || 0) + 1

    await admin
      .from('discussion')
      .update({ likes_count: newCount })
      .eq('id', commentId)

    await admin
      .from('discussion_likes')
      .insert({ discussion_id: commentId, user_id: user.id })

    return NextResponse.json({ liked: true, likes_count: newCount })
  }
}
