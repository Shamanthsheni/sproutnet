import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMissingBlogTablesError, normalizeBlogSetupError } from '@/lib/blogs'
import {
  BLOGS_LOCAL_FALLBACK_ENABLED,
  createLocalBlogPost,
  removeLocalBlogPost,
  updateLocalBlogPost,
} from '@/lib/blogs-local.server'

type Payload = {
  title?: string
  body?: string
  post_type?: string
}

type PatchPayload = {
  post_id?: string
  title?: string
  body?: string
  post_type?: string
}

type DeletePayload = {
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

  const title = payload.title?.trim()
  const body = payload.body?.trim()
  const postType = payload.post_type === 'question' ? 'question' : 'knowledge'

  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  }

  if (!body) {
    return NextResponse.json({ error: 'Post body is required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('blog_posts')
    .insert({
      author_id: user.id,
      title,
      body,
      post_type: postType,
    })

  if (error) {
    if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await createLocalBlogPost({
          authorId: user.id,
          title,
          body,
          postType,
        })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    const message = normalizeBlogSetupError(error.message)
    const status = isMissingBlogTablesError(error.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
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

  let payload: PatchPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const postId = payload.post_id?.trim()
  const hasTitle = typeof payload.title === 'string'
  const hasBody = typeof payload.body === 'string'
  const hasPostType = typeof payload.post_type === 'string'

  if (!postId) {
    return NextResponse.json({ error: 'Missing post_id.' }, { status: 400 })
  }

  if (!hasTitle && !hasBody && !hasPostType) {
    return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
  }

  const title = payload.title?.trim()
  const body = payload.body?.trim()
  const postType = hasPostType ? (payload.post_type === 'question' ? 'question' : 'knowledge') : undefined

  if (hasTitle && !title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  }

  if (hasBody && !body) {
    return NextResponse.json({ error: 'Post body is required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: postRows, error: postError } = await admin
    .from('blog_posts')
    .select('id, author_id')
    .eq('id', postId)
    .limit(1)

  if (postError) {
    if (isMissingBlogTablesError(postError.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await updateLocalBlogPost({
          postId,
          authorId: user.id,
          title: hasTitle ? title : undefined,
          body: hasBody ? body : undefined,
          postType,
        })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Post not found.' ? 404 : message === 'Forbidden' ? 403 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(postError.message)
    const status = isMissingBlogTablesError(postError.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  if (!postRows || postRows.length === 0) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  if (postRows[0].author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: Record<string, string> = {}
  if (hasTitle && title) {
    updates.title = title
  }
  if (hasBody && body) {
    updates.body = body
  }
  if (hasPostType && postType) {
    updates.post_type = postType
  }

  const { error } = await admin
    .from('blog_posts')
    .update(updates)
    .eq('id', postId)
    .eq('author_id', user.id)

  if (error) {
    if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await updateLocalBlogPost({
          postId,
          authorId: user.id,
          title: hasTitle ? title : undefined,
          body: hasBody ? body : undefined,
          postType,
        })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Post not found.' ? 404 : message === 'Forbidden' ? 403 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(error.message)
    const status = isMissingBlogTablesError(error.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
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

  let payload: DeletePayload
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
  const { data: postRows, error: postError } = await admin
    .from('blog_posts')
    .select('id, author_id')
    .eq('id', postId)
    .limit(1)

  if (postError) {
    if (isMissingBlogTablesError(postError.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await removeLocalBlogPost({ postId, authorId: user.id })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Post not found.' ? 404 : message === 'Forbidden' ? 403 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(postError.message)
    const status = isMissingBlogTablesError(postError.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  if (!postRows || postRows.length === 0) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  if (postRows[0].author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('blog_posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id)

  if (error) {
    if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await removeLocalBlogPost({ postId, authorId: user.id })
        return NextResponse.json({ ok: true, local: true })
      } catch (localError) {
        const message = localError instanceof Error ? localError.message : 'Local blog store failed.'
        const status = message === 'Post not found.' ? 404 : message === 'Forbidden' ? 403 : 500
        return NextResponse.json({ error: message }, { status })
      }
    }

    const message = normalizeBlogSetupError(error.message)
    const status = isMissingBlogTablesError(error.message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({ ok: true })
}
