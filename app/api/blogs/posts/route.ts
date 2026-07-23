import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMissingBlogTablesError, normalizeBlogSetupError, isBlogBodyEmpty, type BlogFeedPost } from '@/lib/blogs'
import {
  BLOGS_LOCAL_FALLBACK_ENABLED,
  createLocalBlogPost,
  removeLocalBlogPost,
  updateLocalBlogPost,
  getLocalBlogRows,
} from '@/lib/blogs-local.server'
import { getBlogFeed } from '@/lib/blogs.server'

type Payload = {
  title?: string
  body?: string
  post_type?: string
  // Rich editor fields (all optional — ignored when Supabase schema lacks them)
  cover_image?: string | null
  slug?: string
  excerpt?: string
  tags?: string[]
  category?: string
  seo_title?: string
  seo_description?: string
  status?: 'draft' | 'published'
}

type PatchPayload = {
  post_id?: string
  title?: string
  body?: string
  post_type?: string
  cover_image?: string | null
  slug?: string
  excerpt?: string
  tags?: string[]
  category?: string
  seo_title?: string
  seo_description?: string
  status?: 'draft' | 'published'
}

type DeletePayload = {
  post_id?: string
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null
  const postId = req.nextUrl.searchParams.get('id')

  if (!postId) {
    const feed = await getBlogFeed(userId)
    return NextResponse.json({ posts: feed.posts, error: feed.error })
  }

  const admin = createAdminClient()
  const { data: postRows, error: postError } = await admin
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .limit(1)

  if (postError || !postRows?.length) {
    if (isMissingBlogTablesError(postError?.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      const local = await getLocalBlogRows()
      const localPost = local.posts.find(p => p.id === postId)
      if (!localPost) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      const feed = await getBlogFeed(userId)
      const found = feed.posts.find(p => p.id === postId)
      if (found) return NextResponse.json({ post: found })
    }
    return NextResponse.json({ error: postError?.message || 'Post not found' }, { status: 404 })
  }

  // Fetch comments for this post
  const { data: commentRows } = await admin
    .from('blog_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  // Fetch likes for this post
  const { data: likeRows } = await admin
    .from('blog_post_likes')
    .select('user_id')
    .eq('post_id', postId)

  const likedByViewer = user ? (likeRows || []).some(l => l.user_id === user.id) : false
  const likesCount = likeRows?.length || 0

  // Fetch users (author + commenters)
  const allUserIds = new Set<string>()
  allUserIds.add(postRows[0].author_id)
  if (commentRows) commentRows.forEach(c => allUserIds.add(c.author_id))

  const { data: userRows } = await admin
    .from('users')
    .select('id, name, role, dept, year')
    .in('id', Array.from(allUserIds))

  const userMap = new Map((userRows || []).map(u => [u.id, u]))

  const author = userMap.get(postRows[0].author_id) || null

  const comments = (commentRows || []).map(c => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    author: userMap.get(c.author_id) || null,
    parentId: (c as { parent_comment_id?: string | null }).parent_comment_id || null,
  }))

  const post: BlogFeedPost = {
    id: postRows[0].id,
    title: postRows[0].title,
    body: postRows[0].body,
    postType: postRows[0].post_type === 'question' ? 'question' : 'knowledge',
    createdAt: postRows[0].created_at,
    author: author ? { id: author.id, name: author.name, role: author.role, dept: author.dept, year: author.year } : null,
    likesCount,
    likedByViewer,
    commentsCount: comments.length,
    comments,
    cover_image: (postRows[0] as Record<string, unknown>).cover_image as string | undefined,
    excerpt: (postRows[0] as Record<string, unknown>).excerpt as string | undefined,
  }

  return NextResponse.json({ post })
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

  if (!body || isBlogBodyEmpty(body)) {
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
      cover_image: payload.cover_image ?? null,
      slug: payload.slug?.trim() || null,
      excerpt: payload.excerpt?.trim() || null,
      tags: payload.tags || [],
      category: payload.category?.trim() || null,
      seo_title: payload.seo_title?.trim() || null,
      seo_description: payload.seo_description?.trim() || null,
      status: payload.status === 'draft' ? 'draft' : 'published',
    })

  if (error) {
    if (isMissingBlogTablesError(error.message) && BLOGS_LOCAL_FALLBACK_ENABLED) {
      try {
        await createLocalBlogPost({
          authorId: user.id,
          title,
          body,
          postType,
          coverImage: payload.cover_image ?? null,
          slug: payload.slug?.trim() || null,
          excerpt: payload.excerpt?.trim() || null,
          tags: payload.tags || [],
          category: payload.category?.trim() || null,
          seoTitle: payload.seo_title?.trim() || null,
          seoDescription: payload.seo_description?.trim() || null,
          status: payload.status === 'draft' ? 'draft' : 'published',
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

  if (hasBody && (!body || isBlogBodyEmpty(body))) {
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

  const updates: Record<string, any> = {}
  if (hasTitle && title) {
    updates.title = title
  }
  if (hasBody && body) {
    updates.body = body
  }
  if (hasPostType && postType) {
    updates.post_type = postType
  }
  if (payload.cover_image !== undefined) {
    updates.cover_image = payload.cover_image
  }
  if (payload.slug !== undefined) {
    updates.slug = payload.slug?.trim() || null
  }
  if (payload.excerpt !== undefined) {
    updates.excerpt = payload.excerpt?.trim() || null
  }
  if (payload.tags !== undefined) {
    updates.tags = payload.tags || []
  }
  if (payload.category !== undefined) {
    updates.category = payload.category?.trim() || null
  }
  if (payload.seo_title !== undefined) {
    updates.seo_title = payload.seo_title?.trim() || null
  }
  if (payload.seo_description !== undefined) {
    updates.seo_description = payload.seo_description?.trim() || null
  }
  if (payload.status !== undefined) {
    updates.status = payload.status === 'draft' ? 'draft' : 'published'
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
          coverImage: payload.cover_image,
          slug: payload.slug,
          excerpt: payload.excerpt,
          tags: payload.tags,
          category: payload.category,
          seoTitle: payload.seo_title,
          seoDescription: payload.seo_description,
          status: payload.status,
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
