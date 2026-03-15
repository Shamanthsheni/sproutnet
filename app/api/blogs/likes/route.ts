import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMissingBlogTablesError, normalizeBlogSetupError } from '@/lib/blogs'
import { BLOGS_LOCAL_FALLBACK_ENABLED, toggleLocalBlogLike } from '@/lib/blogs-local.server'

type Payload = {
  post_id?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: Payload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const postId = payload.post_id?.trim()
  if (!postId) {
    return NextResponse.json({ error: 'Missing post_id.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin
    .from('blog_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .limit(1)

  if (existingError) {
    if (isMissingBlogTablesError(existingError.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        const result = await toggleLocalBlogLike({ postId, userId: user.id })
        return NextResponse.json({ ok: true, liked: result.liked, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    const message = normalizeBlogSetupError(existingError.message)
    const status = isMissingBlogTablesError(existingError.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  if (existing && existing.length > 0) {
    const { error } = await admin
      .from('blog_post_likes')
      .delete()
      .eq('id', existing[0].id)
      .eq('user_id', user.id)

    if (error) {
      if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
        try {
          const result = await toggleLocalBlogLike({ postId, userId: user.id })
          return NextResponse.json({ ok: true, liked: result.liked, local: true })
        } catch (localError) {
          const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
          return NextResponse.json({ error: message }, { status: 500 })
        }
      }

      const message = normalizeBlogSetupError(error.message)
      const status = isMissingBlogTablesError(error.message) ? 503 : 400
      return NextResponse.json({ error: message }, { status })
    }

    return NextResponse.json({ ok: true, liked: false })
  }

  const { error } = await admin
    .from('blog_post_likes')
    .insert({
      post_id: postId,
      user_id: user.id,
    })

  if (error) {
    if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        const result = await toggleLocalBlogLike({ postId, userId: user.id })
        return NextResponse.json({ ok: true, liked: result.liked, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    const message = normalizeBlogSetupError(error.message)
    const status = isMissingBlogTablesError(error.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({ ok: true, liked: true })
}
