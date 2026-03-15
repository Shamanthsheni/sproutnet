export const BLOGS_SETUP_SQL_PATH = 'supabase/migrations/20260314_create_blogs.sql'
export const BLOGS_SETUP_REQUIRED_MESSAGE = `Blogs is not set up yet. Run the SQL in ${BLOGS_SETUP_SQL_PATH} and refresh this page.`
export const BLOGS_REPLIES_SETUP_SQL_PATH = 'supabase/migrations/20260315_add_blog_comment_parent.sql'
export const BLOGS_REPLIES_SETUP_REQUIRED_MESSAGE = `Replies are not set up yet. Run the SQL in ${BLOGS_REPLIES_SETUP_SQL_PATH} and refresh this page.`

export type BlogUserSummary = {
  id: string
  name: string
  role: string
  dept: string | null
  year: string | null
}

export type BlogCommentItem = {
  id: string
  body: string
  createdAt: string
  author: BlogUserSummary | null
  parentId: string | null
}

export type BlogFeedPost = {
  id: string
  title: string
  body: string
  postType: 'knowledge' | 'question'
  createdAt: string
  author: BlogUserSummary | null
  likesCount: number
  likeUsers?: BlogUserSummary[]
  commentsCount: number
  likedByViewer: boolean
  comments: BlogCommentItem[]
}

export function isMissingBlogTablesError(message: string | null | undefined) {
  if (!message) return false

  const normalized = message.toLowerCase()
  const mentionsBlogTables = ['blog_posts', 'blog_comments', 'blog_post_likes']
    .some(table => normalized.includes(table))
  const missingTableIndicators = (
    normalized.includes('schema cache') ||
    normalized.includes('does not exist') ||
    normalized.includes('unknown table') ||
    normalized.includes('relation')
  )

  return mentionsBlogTables && missingTableIndicators
}

export function isMissingBlogCommentParentColumnError(message: string | null | undefined) {
  if (!message) return false

  const normalized = message.toLowerCase()

  return (
    normalized.includes('parent_comment_id') &&
    (
      normalized.includes('schema cache') ||
      normalized.includes('does not exist') ||
      normalized.includes('unknown column')
    )
  )
}

export function normalizeBlogSetupError(message: string | null | undefined) {
  if (isMissingBlogTablesError(message)) {
    return BLOGS_SETUP_REQUIRED_MESSAGE
  }

  return message ?? 'Could not load the blog feed.'
}
