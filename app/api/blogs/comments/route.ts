import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMissingBlogTablesError, normalizeBlogSetupError } from '@/lib/blogs'
import {
  BLOGS_LOCAL_FALLBACK_ENABLED,
  addLocalBlogComment,
  removeLocalBlogComment,
} from '@/lib/blogs-local.server'

type Payload = {
  post_id?: string
  body?: string
  parent_comment_id?: string
}

type DeletePayload = {
  comment_id?: string
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
  const body = payload.body?.trim()
  const parentCommentId = payload.parent_comment_id?.trim()

  if (!postId) {
    return NextResponse.json({ error: 'Missing post_id.' }, { status: 400 })
  }

  if (!body) {
    return NextResponse.json({ error: 'Comment body is required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: post, error: postError } = await admin
    .from('blog_posts')
    .select('id')
    .eq('id', postId)
    .limit(1)

  if (postError) {
    if (isMissingBlogTablesError(postError.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await addLocalBlogComment({
          postId,
          authorId: user.id,
          body,
          parentCommentId,
        })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Post not found.' || message === 'Parent comment not found.' ? 404 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(postError.message)
    const status = isMissingBlogTablesError(postError.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  if (!post || post.length === 0) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  if (parentCommentId) {
    const { data: parentRows, error: parentError } = await admin
      .from('blog_comments')
      .select('id, post_id')
      .eq('id', parentCommentId)
      .limit(1)

    if (parentError) {
      const message = normalizeBlogSetupError(parentError.message)
      const status = isMissingBlogTablesError(parentError.message) ? 503 : 400
      return NextResponse.json({ error: message }, { status })
    }

    if (!parentRows || parentRows.length === 0 || parentRows[0].post_id !== postId) {
      return NextResponse.json({ error: 'Parent comment not found.' }, { status: 404 })
    }
  }

  const { data: insertedComment, error } = await admin
    .from('blog_comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      body,
      parent_comment_id: parentCommentId ?? null,
    })
    .select('id, post_id, body, created_at, author_id, parent_comment_id')
    .single()

  if (error) {
    if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await addLocalBlogComment({
          postId,
          authorId: user.id,
          body,
          parentCommentId,
        })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Post not found.' || message === 'Parent comment not found.' ? 404 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(error.message)
    const status = isMissingBlogTablesError(error.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  if (insertedComment) {
    const { data: authorProfile } = await admin
      .from('users')
      .select('id, name, role, dept, year')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      ok: true,
      comment: {
        id: insertedComment.id,
        body: insertedComment.body,
        createdAt: insertedComment.created_at,
        author: authorProfile ? { id: authorProfile.id, name: authorProfile.name, role: authorProfile.role, dept: authorProfile.dept, year: authorProfile.year } : null,
        parentId: insertedComment.parent_comment_id || null,
      }
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: DeletePayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const commentId = payload.comment_id?.trim()
  if (!commentId) {
    return NextResponse.json({ error: 'Missing comment_id.' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const isModerator = profile?.role === 'admin'

  const admin = createAdminClient()
  const { data: commentRows, error: commentError } = await admin
    .from('blog_comments')
    .select('id, author_id')
    .eq('id', commentId)
    .limit(1)

  if (commentError) {
    if (isMissingBlogTablesError(commentError.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await removeLocalBlogComment({ commentId, authorId: user.id })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Comment not found.' ? 404 : message === 'Forbidden' ? 403 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(commentError.message)
    const status = isMissingBlogTablesError(commentError.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  if (!commentRows || commentRows.length === 0) {
    return NextResponse.json({ error: 'Comment not found.' }, { status: 404 })
  }

  if (commentRows[0].author_id !== user.id && !isModerator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Replies cascade-delete with their parent.
  const { error } = isModerator && commentRows[0].author_id !== user.id
    ? await admin.from('blog_comments').delete().eq('id', commentId)
    : await admin.from('blog_comments').delete().eq('id', commentId).eq('author_id', user.id)

  if (error) {
    if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await removeLocalBlogComment({ commentId, authorId: user.id })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Comment not found.' ? 404 : message === 'Forbidden' ? 403 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(error.message)
    const status = isMissingBlogTablesError(error.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({ ok: true })
}
