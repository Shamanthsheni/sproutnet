'use client'

import Link from 'next/link'
import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BLOGS_SETUP_REQUIRED_MESSAGE,
  BLOGS_SETUP_SQL_PATH,
  type BlogFeedPost,
  type BlogUserSummary,
} from '@/lib/blogs'

type BlogsFeedProps = {
  viewer: BlogUserSummary | null
  initialPosts: BlogFeedPost[]
  loadError?: string | null
  setupRequired?: boolean
  showComposer?: boolean
  showSidebar?: boolean
  showFeed?: boolean
  emptyState?: {
    title: string
    body: string
  }
}

const POST_TYPE_META = {
  knowledge: {
    label: 'Knowledge Share',
    accent: '#2D6A4F',
    background: '#EAF4EE',
    description: 'Share something useful you learned, built, or tested.',
  },
  question: {
    label: 'Question / Doubt',
    accent: '#1E40AF',
    background: 'rgba(30,64,175,0.08)',
    description: 'Ask for feedback, clarity, or help from the community.',
  },
} as const

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatRole(role: string | null | undefined) {
  if (!role) return 'Member'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function readErrorMessage(res: Response, fallback: string) {
  const text = await res.text().catch(() => '')
  if (!text) return fallback

  try {
    const data = JSON.parse(text)
    return data?.error ?? fallback
  } catch {
    return text
  }
}

export default function BlogsFeed({
  viewer,
  initialPosts,
  loadError,
  setupRequired = false,
  showComposer = true,
  showSidebar = true,
  showFeed = true,
  emptyState,
}: BlogsFeedProps) {
  const router = useRouter()
  const [postType, setPostType] = useState<'knowledge' | 'question'>('knowledge')
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const [submittingPost, setSubmittingPost] = useState(false)
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [postingReplyId, setPostingReplyId] = useState<string | null>(null)
  const [likingPostId, setLikingPostId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const dashboardHref = !viewer ? '/login' : viewer.role === 'poster' ? '/poster/dashboard' : '/dashboard'
  const posts = initialPosts
  const emptyStateTitle = emptyState?.title ?? 'No blog posts yet'
  const emptyStateBody = emptyState?.body ?? 'The feed is empty for now. The first knowledge share or question posted here will become the starting point for the whole community.'

  async function handleCreatePost() {
    if (submittingPost) return
    if (setupRequired) {
      setActionError(BLOGS_SETUP_REQUIRED_MESSAGE)
      return
    }

    setSubmittingPost(true)
    setActionError('')

    const res = await fetch('/api/blogs/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: postTitle,
        body: postBody,
        post_type: postType,
      }),
    })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not publish the post (${res.status}).`))
      setSubmittingPost(false)
      return
    }

    setPostTitle('')
    setPostBody('')
    setSubmittingPost(false)
    startTransition(() => router.refresh())
  }

  async function handleComment(postId: string) {
    if (commentingPostId) return
    if (setupRequired) {
      setActionError(BLOGS_SETUP_REQUIRED_MESSAGE)
      return
    }

    setCommentingPostId(postId)
    setActionError('')

    const res = await fetch('/api/blogs/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        body: commentDrafts[postId] ?? '',
      }),
    })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not post the comment (${res.status}).`))
      setCommentingPostId(null)
      return
    }

    setCommentDrafts(prev => ({ ...prev, [postId]: '' }))
    setCommentingPostId(null)
    startTransition(() => router.refresh())
  }

  function toggleComments(postId: string) {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  function toggleReply(commentId: string) {
    setReplyingCommentId(prev => (prev === commentId ? null : commentId))
  }

  async function handleLike(postId: string) {
    if (likingPostId) return
    if (setupRequired) {
      setActionError(BLOGS_SETUP_REQUIRED_MESSAGE)
      return
    }

    setLikingPostId(postId)
    setActionError('')

    const res = await fetch('/api/blogs/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not update the like (${res.status}).`))
      setLikingPostId(null)
      return
    }

    setLikingPostId(null)
    startTransition(() => router.refresh())
  }

  async function handleReply(postId: string, commentId: string) {
    if (postingReplyId) return
    if (setupRequired) {
      setActionError(BLOGS_SETUP_REQUIRED_MESSAGE)
      return
    }

    setPostingReplyId(commentId)
    setActionError('')

    const res = await fetch('/api/blogs/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        body: replyDrafts[commentId] ?? '',
        parent_comment_id: commentId,
      }),
    })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not post the reply (${res.status}).`))
      setPostingReplyId(null)
      return
    }

    setReplyDrafts(prev => ({ ...prev, [commentId]: '' }))
    setReplyingCommentId(null)
    setPostingReplyId(null)
    startTransition(() => router.refresh())
  }

  async function handleDeleteComment(commentId: string) {
    if (deletingCommentId) return
    if (setupRequired) {
      setActionError(BLOGS_SETUP_REQUIRED_MESSAGE)
      return
    }

    setDeletingCommentId(commentId)
    setActionError('')

    const res = await fetch('/api/blogs/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId }),
    })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not delete the comment (${res.status}).`))
      setDeletingCommentId(null)
      return
    }

    setDeletingCommentId(null)
    startTransition(() => router.refresh())
  }

  return (
    <div
      className="blogs-layout"
      style={showSidebar ? undefined : { gridTemplateColumns: 'minmax(0, 1fr)' }}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {loadError && setupRequired && (
          <section style={{ background: '#fff', border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 18, padding: 24 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 8 }}>
              Blogs needs one database setup step
            </div>
            <div style={{ fontSize: 14, color: '#6A5F58', lineHeight: 1.7 }}>
              The feed tables are not available yet. Run the SQL in <code>{BLOGS_SETUP_SQL_PATH}</code> and refresh this page.
            </div>
            {loadError !== BLOGS_SETUP_REQUIRED_MESSAGE && (
              <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 10 }}>{loadError}</div>
            )}
          </section>
        )}

        {loadError && !setupRequired && (
          <section style={{ background: '#fff', border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 18, padding: 24 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 8 }}>
              Could not load the blog feed
            </div>
            <div style={{ fontSize: 14, color: '#6A5F58', lineHeight: 1.7 }}>
              Refresh the page in a moment. If this keeps happening, the server query needs attention.
            </div>
            <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 10 }}>{loadError}</div>
          </section>
        )}

        {showComposer && (
          viewer ? (
            <section style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 20, padding: 24, boxShadow: '0 10px 32px rgba(28,20,16,0.05)' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                {'// write a post'}
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410', marginBottom: 10 }}>
                {setupRequired ? 'Publishing opens after the Blogs migration runs' : 'What do you want the community to see today?'}
              </div>
              <div style={{ fontSize: 14, color: '#5C524A', lineHeight: 1.75, marginBottom: 16 }}>
                {setupRequired
                  ? 'This environment is missing the blog feed tables, so posting, comments, and likes are paused until setup is completed.'
                  : POST_TYPE_META[postType].description}
              </div>
              {setupRequired ? (
                <code style={{ display: 'inline-block', fontSize: 12, color: '#5C524A', background: '#F6F2EB', borderRadius: 999, padding: '10px 14px' }}>
                  {BLOGS_SETUP_SQL_PATH}
                </code>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {(['knowledge', 'question'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPostType(type)}
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: 13,
                          fontWeight: 600,
                          color: postType === type ? '#1C1410' : POST_TYPE_META[type].accent,
                          background: postType === type ? '#F4A723' : POST_TYPE_META[type].background,
                          border: 'none',
                          borderRadius: 999,
                          padding: '9px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        {POST_TYPE_META[type].label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={postTitle}
                    onChange={e => setPostTitle(e.target.value)}
                    placeholder="Give your post a sharp title"
                    style={{ width: '100%', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 12, padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#1C1410', marginBottom: 12, outline: 'none' }}
                  />
                  <textarea
                    value={postBody}
                    onChange={e => setPostBody(e.target.value)}
                    placeholder={postType === 'question'
                      ? 'What are you stuck on? Add context so others can help well.'
                      : 'Share a lesson, framework, observation, or field note that could help someone else.'}
                    rows={6}
                    style={{ width: '100%', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 14, padding: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#1C1410', resize: 'vertical', outline: 'none', lineHeight: 1.7, marginBottom: 14 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, color: '#7A7068' }}>Posts go straight into the shared feed for the whole community.</div>
                    <button
                      type="button"
                      onClick={handleCreatePost}
                      disabled={submittingPost}
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1410', background: submittingPost ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: submittingPost ? 'not-allowed' : 'pointer', boxShadow: '0 8px 18px rgba(244,167,35,0.22)' }}
                    >
                      {submittingPost ? 'Publishing...' : 'Publish to Blogs ->'}
                    </button>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section style={{ background: 'linear-gradient(135deg, #EAF4EE 0%, #F6F2EB 100%)', border: '1px solid rgba(45,106,79,0.12)', borderRadius: 20, padding: 24 }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410', marginBottom: 10 }}>
                Join the conversation
              </div>
              <div style={{ fontSize: 14, color: '#5C524A', lineHeight: 1.7, marginBottom: 16 }}>
                You can read the whole feed without signing in. To publish posts, comment, or like, log in with your SproutNet account.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: '#1C1410', background: '#F4A723', padding: '12px 18px', borderRadius: 10, textDecoration: 'none' }}>{'Log in ->'}</Link>
                <Link href="/join" style={{ fontSize: 14, fontWeight: 600, color: '#2D6A4F', background: '#fff', padding: '12px 18px', borderRadius: 10, textDecoration: 'none' }}>Create account</Link>
              </div>
            </section>
          )
        )}

        {actionError && (
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 14, padding: '14px 16px', fontSize: 13, color: '#B91C1C' }}>
            {actionError}
          </div>
        )}

        {showFeed && (
          posts.length === 0 && !loadError ? (
            <section style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 18, padding: '42px 28px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410', marginBottom: 8 }}>
                {emptyStateTitle}
              </div>
              <div style={{ fontSize: 14, color: '#6A5F58', lineHeight: 1.7 }}>
                {emptyStateBody}
              </div>
            </section>
          ) : (
            posts.map(post => {
              const meta = POST_TYPE_META[post.postType]
            const isCommenting = commentingPostId === post.id
            const isLiking = likingPostId === post.id
            const commentValue = commentDrafts[post.id] ?? ''
            const isOpen = Boolean(openComments[post.id])
            const commentsByParent = new Map<string, typeof post.comments>()
            const rootComments = [] as typeof post.comments

            for (const comment of post.comments) {
              const parentId = comment.parentId ?? null
              if (parentId) {
                const list = commentsByParent.get(parentId) ?? []
                list.push(comment)
                commentsByParent.set(parentId, list)
              } else {
                rootComments.push(comment)
              }
            }

            const renderCommentList = (list: typeof post.comments, depth: number) => list.map(comment => {
              const canDelete = Boolean(viewer && comment.author?.id && viewer.id === comment.author.id)
              const isDeleting = deletingCommentId === comment.id
              const canReply = Boolean(viewer)
              const isReplying = replyingCommentId === comment.id
              const replyValue = replyDrafts[comment.id] ?? ''
              const isPostingReply = postingReplyId === comment.id
              const replies = commentsByParent.get(comment.id) ?? []

              return (
                <div key={comment.id} style={{ marginLeft: depth ? 18 : 0 }}>
                  <div style={{ background: '#fff', border: '1px solid rgba(28,20,16,0.06)', borderRadius: 14, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#1C1410' }}>{comment.author?.name ?? 'SproutNet member'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 11, color: '#8A8078' }}>{formatRole(comment.author?.role)} - {formatDate(comment.createdAt)}</div>
                        {canReply && (
                          <button
                            type="button"
                            onClick={() => toggleReply(comment.id)}
                            disabled={setupRequired}
                            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: '#2D6A4F', background: 'rgba(45,106,79,0.12)', border: 'none', borderRadius: 999, padding: '6px 10px', cursor: setupRequired ? 'not-allowed' : 'pointer' }}
                          >
                            {isReplying ? 'Cancel' : 'Reply'}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isDeleting}
                            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: '#B91C1C', background: 'rgba(185,28,28,0.08)', border: 'none', borderRadius: 999, padding: '6px 10px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: '#3F352E', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{comment.body}</div>
                    {isReplying && canReply && !setupRequired && (
                      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        <textarea
                          value={replyValue}
                          onChange={e => setReplyDrafts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                          placeholder="Write a reply..."
                          rows={3}
                          style={{ width: '100%', border: '1px solid rgba(28,20,16,0.1)', borderRadius: 12, padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#fff', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleReply(post.id, comment.id)}
                            disabled={isPostingReply}
                            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#FAF8F4', background: '#2D6A4F', border: 'none', borderRadius: 10, padding: '9px 14px', cursor: isPostingReply ? 'not-allowed' : 'pointer' }}
                          >
                            {isPostingReply ? 'Posting...' : 'Post reply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {replies.length > 0 && (
                    <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid rgba(28,20,16,0.06)', display: 'grid', gap: 12 }}>
                      {renderCommentList(replies, depth + 1)}
                    </div>
                  )}
                </div>
              )
            })

              return (
                <article key={post.id} style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 20, padding: 22, boxShadow: '0 12px 30px rgba(28,20,16,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
                    <div style={{ display: 'flex', gap: 14, minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: meta.background, color: meta.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                        {initials(post.author?.name ?? 'SN')}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#1C1410' }}>{post.author?.name ?? 'SproutNet member'}</div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: meta.accent, background: meta.background, padding: '4px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#7A7068' }}>{formatRole(post.author?.role)} - {formatDate(post.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6A5F58', background: '#F6F2EB', padding: '6px 10px', borderRadius: 999 }}>
                      {post.commentsCount} comment{post.commentsCount === 1 ? '' : 's'}
                    </div>
                  </div>

                  <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: '#1C1410', lineHeight: 1.2, marginBottom: 12 }}>{post.title}</h2>
                  <p style={{ fontSize: 15, color: '#3F352E', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 18 }}>{post.body}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid rgba(28,20,16,0.07)', marginBottom: 18 }}>
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      disabled={!viewer || isLiking || setupRequired}
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: post.likedByViewer ? '#1C1410' : '#7A7068', background: post.likedByViewer ? '#F4A723' : '#F6F2EB', border: 'none', borderRadius: 999, padding: '9px 14px', cursor: !viewer || isLiking || setupRequired ? 'not-allowed' : 'pointer' }}
                    >
                      {setupRequired
                        ? 'Blogs unavailable'
                        : isLiking
                          ? 'Updating...'
                          : post.likedByViewer
                            ? `Liked - ${post.likesCount}`
                            : `Like - ${post.likesCount}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#2D6A4F', background: '#FAF8F4', border: 'none', borderRadius: 999, padding: '9px 14px', cursor: 'pointer' }}
                    >
                      {isOpen ? `Hide comments (${post.commentsCount})` : `View comments (${post.commentsCount})`}
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ background: '#FAF8F4', borderRadius: 16, padding: 18 }}>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1410', marginBottom: 14 }}>
                        Discussion
                      </div>
                    {rootComments.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#7A7068', marginBottom: 14 }}>No comments yet. Start the thread.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                        {renderCommentList(rootComments, 0)}
                      </div>
                    )}
                      {viewer && !setupRequired ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          <textarea
                            value={commentValue}
                            onChange={e => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Add a comment that moves the conversation forward..."
                            rows={3}
                            style={{ width: '100%', border: '1px solid rgba(28,20,16,0.1)', borderRadius: 12, padding: '12px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#fff', resize: 'vertical', outline: 'none', lineHeight: 1.65 }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleComment(post.id)}
                              disabled={isCommenting}
                              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#FAF8F4', background: '#2D6A4F', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: isCommenting ? 'not-allowed' : 'pointer' }}
                            >
                              {isCommenting ? 'Posting...' : 'Post comment'}
                            </button>
                          </div>
                        </div>
                      ) : setupRequired ? (
                        <div style={{ fontSize: 13, color: '#7A7068' }}>Commenting opens after the Blogs migration is applied.</div>
                      ) : (
                        <Link href="/login" style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: '#2D6A4F', textDecoration: 'none' }}>
                          {'Log in to comment ->'}
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              )
            })
          )
        )}
      </div>

      {showSidebar && (
        <aside style={{ display: 'grid', gap: 18 }}>
          <section style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 18, padding: 22 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              {'// feed snapshot'}
            </div>
            {setupRequired ? (
              <>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 10 }}>Setup pending</div>
                <div style={{ fontSize: 13, color: '#5C524A', lineHeight: 1.7 }}>Feed totals will appear here after the Blogs tables are created for this environment.</div>
              </>
            ) : (
              [
                { label: 'Visible posts', value: posts.length, accent: '#2D6A4F' },
                { label: 'Questions open', value: posts.filter(post => post.postType === 'question').length, accent: '#1E40AF' },
                { label: 'Knowledge shares', value: posts.filter(post => post.postType === 'knowledge').length, accent: '#F4A723' },
              ].map((item, index) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: index < 2 ? '1px solid rgba(28,20,16,0.06)' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#7A7068' }}>{item.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: item.accent }}>{item.value}</span>
                </div>
              ))
            )}
          </section>

          <section style={{ background: 'linear-gradient(135deg, #1C1410 0%, #2D6A4F 100%)', borderRadius: 18, padding: 22, color: '#FAF8F4' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(250,248,244,0.42)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              {'// how to post well'}
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Strong posts help faster</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                'Name the exact problem, insight, or confusion in the title.',
                'Add enough context that someone outside your project can still help.',
                'Use comments to refine the thread instead of rewriting the whole post.',
              ].map(item => (
                <div key={item} style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(250,248,244,0.78)' }}>{item}</div>
              ))}
            </div>
          </section>

          <section style={{ background: '#F6F2EB', borderRadius: 18, padding: 22, border: '1px solid rgba(28,20,16,0.06)' }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: '#1C1410', marginBottom: 10 }}>
              {setupRequired ? 'Blogs setup pending' : viewer ? `Posting as ${viewer.name}` : 'Need your own feed presence?'}
            </div>
            <div style={{ fontSize: 13, color: '#5C524A', lineHeight: 1.7, marginBottom: 16 }}>
              {setupRequired
                ? 'Publishing, comments, and likes stay locked until the blog feed tables are created in Supabase.'
                : viewer
                  ? 'Your posts and comments publish under your SproutNet account and become visible to everyone on this page.'
                  : 'Sign in to publish a post, react to ideas, and answer questions from other builders.'}
            </div>
            {setupRequired ? (
              <code style={{ display: 'inline-block', fontSize: 12, color: '#5C524A', background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
                {BLOGS_SETUP_SQL_PATH}
              </code>
            ) : (
              <Link href={dashboardHref} style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: '#1C1410', background: '#F4A723', padding: '11px 16px', borderRadius: 10, textDecoration: 'none' }}>
                {viewer ? 'Go to dashboard ->' : 'Log in ->'}
              </Link>
            )}
          </section>
        </aside>
      )}
    </div>
  )
}
