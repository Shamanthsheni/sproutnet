import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export const BLOGS_LOCAL_FALLBACK_ENABLED = process.env.BLOGS_ALLOW_LOCAL_FALLBACK !== 'false'

export type LocalBlogPostRow = {
  id: string
  title: string
  body: string
  post_type: string
  created_at: string
  author_id: string
}

export type LocalBlogCommentRow = {
  id: string
  post_id: string
  body: string
  created_at: string
  author_id: string
  parent_comment_id: string | null
}

export type LocalBlogLikeRow = {
  post_id: string
  user_id: string
}

type LocalBlogsData = {
  posts: LocalBlogPostRow[]
  comments: LocalBlogCommentRow[]
  likes: LocalBlogLikeRow[]
}

const BLOGS_LOCAL_DATA_PATH = path.join(process.cwd(), '.data', 'blogs.json')

function normalizeLocalData(value: unknown): LocalBlogsData {
  if (!value || typeof value !== 'object') {
    return { posts: [], comments: [], likes: [] }
  }

  const data = value as { posts?: unknown; comments?: unknown; likes?: unknown }

  return {
    posts: Array.isArray(data.posts) ? (data.posts as LocalBlogPostRow[]) : [],
    comments: Array.isArray(data.comments) ? (data.comments as LocalBlogCommentRow[]) : [],
    likes: Array.isArray(data.likes) ? (data.likes as LocalBlogLikeRow[]) : [],
  }
}

async function readLocalData(): Promise<LocalBlogsData> {
  try {
    const raw = await fs.readFile(BLOGS_LOCAL_DATA_PATH, 'utf8')
    return normalizeLocalData(JSON.parse(raw))
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return { posts: [], comments: [], likes: [] }
    }
    throw err
  }
}

async function writeLocalData(data: LocalBlogsData) {
  await fs.mkdir(path.dirname(BLOGS_LOCAL_DATA_PATH), { recursive: true })
  await fs.writeFile(BLOGS_LOCAL_DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export async function getLocalBlogRows(): Promise<LocalBlogsData> {
  return readLocalData()
}

export async function createLocalBlogPost(params: {
  authorId: string
  title: string
  body: string
  postType: 'knowledge' | 'question'
}) {
  const data = await readLocalData()
  const post: LocalBlogPostRow = {
    id: randomUUID(),
    author_id: params.authorId,
    title: params.title,
    body: params.body,
    post_type: params.postType,
    created_at: new Date().toISOString(),
  }

  data.posts.unshift(post)
  await writeLocalData(data)

  return post
}

export async function updateLocalBlogPost(params: {
  postId: string
  authorId: string
  title?: string
  body?: string
  postType?: 'knowledge' | 'question'
}) {
  const data = await readLocalData()
  const index = data.posts.findIndex(post => post.id === params.postId)

  if (index < 0) {
    throw new Error('Post not found.')
  }

  const post = data.posts[index]
  if (post.author_id !== params.authorId) {
    throw new Error('Forbidden')
  }

  if (typeof params.title === 'string') {
    post.title = params.title
  }

  if (typeof params.body === 'string') {
    post.body = params.body
  }

  if (typeof params.postType === 'string') {
    post.post_type = params.postType
  }

  data.posts[index] = post
  await writeLocalData(data)
  return post
}

export async function removeLocalBlogPost(params: { postId: string; authorId: string }) {
  const data = await readLocalData()
  const index = data.posts.findIndex(post => post.id === params.postId)

  if (index < 0) {
    throw new Error('Post not found.')
  }

  const post = data.posts[index]
  if (post.author_id !== params.authorId) {
    throw new Error('Forbidden')
  }

  data.posts.splice(index, 1)
  data.comments = data.comments.filter(comment => comment.post_id !== params.postId)
  data.likes = data.likes.filter(like => like.post_id !== params.postId)
  await writeLocalData(data)
}

export async function addLocalBlogComment(params: {
  postId: string
  authorId: string
  body: string
  parentCommentId?: string | null
}) {
  const data = await readLocalData()
  const postExists = data.posts.some(post => post.id === params.postId)

  if (!postExists) {
    throw new Error('Post not found.')
  }

  if (params.parentCommentId) {
    const parent = data.comments.find(comment => comment.id === params.parentCommentId)
    if (!parent || parent.post_id !== params.postId) {
      throw new Error('Parent comment not found.')
    }
  }

  const comment: LocalBlogCommentRow = {
    id: randomUUID(),
    post_id: params.postId,
    author_id: params.authorId,
    body: params.body,
    created_at: new Date().toISOString(),
    parent_comment_id: params.parentCommentId ?? null,
  }

  data.comments.push(comment)
  await writeLocalData(data)

  return comment
}

export async function removeLocalBlogComment(params: { commentId: string; authorId: string }) {
  const data = await readLocalData()
  const index = data.comments.findIndex(comment => comment.id === params.commentId)

  if (index < 0) {
    throw new Error('Comment not found.')
  }

  const comment = data.comments[index]
  if (comment.author_id !== params.authorId) {
    throw new Error('Forbidden')
  }

  const idsToRemove = new Set<string>([params.commentId])
  let found = true
  while (found) {
    found = false
    for (const entry of data.comments) {
      if (entry.parent_comment_id && idsToRemove.has(entry.parent_comment_id) && !idsToRemove.has(entry.id)) {
        idsToRemove.add(entry.id)
        found = true
      }
    }
  }

  data.comments = data.comments.filter(entry => !idsToRemove.has(entry.id))
  await writeLocalData(data)
}

export async function toggleLocalBlogLike(params: { postId: string; userId: string }) {
  const data = await readLocalData()
  const index = data.likes.findIndex(
    like => like.post_id === params.postId && like.user_id === params.userId
  )

  let liked = false
  if (index >= 0) {
    data.likes.splice(index, 1)
    liked = false
  } else {
    data.likes.push({ post_id: params.postId, user_id: params.userId })
    liked = true
  }

  await writeLocalData(data)
  return { liked }
}
