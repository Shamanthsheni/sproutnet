'use client'

import Link from 'next/link'
import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BLOGS_SETUP_REQUIRED_MESSAGE,
  isBlogBodyEmpty,
  getBlogBodyText,
  type BlogFeedPost,
  type BlogUserSummary,
} from '@/lib/blogs'

type MyPostsPanelProps = {
  viewer: BlogUserSummary | null
  posts: BlogFeedPost[]
  loadError?: string | null
  setupRequired?: boolean
}

type DraftState = {
  title: string
  body: string
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

export default function MyPostsPanel({
  viewer,
  posts,
  loadError,
  setupRequired = false,
}: MyPostsPanelProps) {
  const router = useRouter()
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [openLikes, setOpenLikes] = useState<Record<string, boolean>>({})
  const [savingPostId, setSavingPostId] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  function startEdit(post: BlogFeedPost) {
    setDrafts(prev => ({
      ...prev,
      [post.id]: {
        title: prev[post.id]?.title ?? post.title,
        body: prev[post.id]?.body ?? getBlogBodyText(post.body),
      },
    }))
    setEditingPostId(post.id)
  }

  function cancelEdit() {
    setEditingPostId(null)
  }

  function toggleComments(postId: string) {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  function toggleLikes(postId: string) {
    setOpenLikes(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  async function handleSave(postId: string) {
    if (savingPostId) return
    if (setupRequired) {
      setActionError(BLOGS_SETUP_REQUIRED_MESSAGE)
      return
    }

    const draft = drafts[postId]
    if (!draft) {
      setActionError('Nothing to update yet.')
      return
    }

    const title = draft.title.trim()
    const body = draft.body.trim()

    if (!title) {
      setActionError('Title is required.')
      return
    }
    if (isBlogBodyEmpty(body)) {
      setActionError('Post body is required.')
      return
    }

    setSavingPostId(postId)
    setActionError('')

    const res = await fetch('/api/blogs/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        title,
        body,
      }),
    })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not update the post (${res.status}).`))
      setSavingPostId(null)
      return
    }

    setSavingPostId(null)
    setEditingPostId(null)
    startTransition(() => router.refresh())
  }

  async function handleDelete(postId: string) {
    if (deletingPostId) return
    if (setupRequired) {
      setActionError(BLOGS_SETUP_REQUIRED_MESSAGE)
      return
    }
    if (!confirm('Delete this post? This cannot be undone.')) return

    setDeletingPostId(postId)
    setActionError('')

    const res = await fetch('/api/blogs/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    })

    if (!res.ok) {
      setActionError(await readErrorMessage(res, `Could not delete the post (${res.status}).`))
      setDeletingPostId(null)
      return
    }

    setDeletingPostId(null)
    if (editingPostId === postId) {
      setEditingPostId(null)
    }
    startTransition(() => router.refresh())
  }

  return (
    <section style={{ background: '#fff', borderRadius: 20, padding: 22, border: '1px solid rgba(28,20,16,0.08)', boxShadow: '0 10px 24px rgba(28,20,16,0.05)' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        {'// your posts'}
      </div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 10 }}>
        Previous posts
      </div>
      <div style={{ fontSize: 13, color: '#6A5F58', lineHeight: 1.7, marginBottom: 18 }}>
        Edit your posts and review who is engaging with them.
      </div>

      {!viewer ? (
        <>
          <div style={{ fontSize: 13, color: '#5C524A', lineHeight: 1.7, marginBottom: 12 }}>
            Sign in to see and manage everything you have shared.
          </div>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color: '#1C1410', background: '#F4A723', padding: '10px 14px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>
            {'Log in ->'}
          </Link>
        </>
      ) : (
        <>
          {loadError && (
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#B91C1C', marginBottom: 14 }}>
              {loadError}
            </div>
          )}
          {actionError && (
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#B91C1C', marginBottom: 14 }}>
              {actionError}
            </div>
          )}
          {posts.length === 0 ? (
            <div style={{ fontSize: 13, color: '#6A5F58', lineHeight: 1.7 }}>
              You have not published anything yet. Start with a short knowledge share or question.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {posts.map(post => {
                const isEditing = editingPostId === post.id
                const draft = drafts[post.id]
                const titleValue = draft?.title ?? post.title
                const bodyValue = draft?.body ?? getBlogBodyText(post.body)
                const isSaving = savingPostId === post.id
                const isDeleting = deletingPostId === post.id
                const showComments = Boolean(openComments[post.id])
                const showLikes = Boolean(openLikes[post.id])

                const commentsByParent = new Map<string, typeof post.comments>()
                const rootComments: typeof post.comments = []
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

                const likeUsers = Array.from(
                  new Map((post.likeUsers ?? []).map(user => [user.id, user])).values()
                )

                const renderCommentList = (list: typeof post.comments, depth: number) => (
                  list.map(comment => {
                    const replies = commentsByParent.get(comment.id) ?? []
                    return (
                      <div key={comment.id} style={{ marginLeft: depth ? 16 : 0 }}>
                        <div style={{ background: '#fff', border: '1px solid rgba(28,20,16,0.06)', borderRadius: 12, padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 700, color: '#1C1410' }}>
                              {comment.author?.name ?? 'SproutNet member'}
                            </div>
                            <div style={{ fontSize: 11, color: '#8A8078' }}>
                              {formatRole(comment.author?.role)} - {formatDate(comment.createdAt)}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: '#3F352E', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {comment.body}
                          </div>
                        </div>
                        {replies.length > 0 && (
                          <div style={{ marginTop: 10, paddingLeft: 10, borderLeft: '2px solid rgba(28,20,16,0.06)', display: 'grid', gap: 10 }}>
                            {renderCommentList(replies, depth + 1)}
                          </div>
                        )}
                      </div>
                    )
                  })
                )

                return (
                  <div key={post.id} style={{ border: '1px solid rgba(28,20,16,0.06)', borderRadius: 14, padding: '14px 16px', background: '#FAF8F4' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1410', lineHeight: 1.3 }}>
                        {post.title}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => toggleComments(post.id)}
                          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#2D6A4F', background: 'rgba(45,106,79,0.12)', border: 'none', borderRadius: 999, padding: '6px 10px', cursor: 'pointer' }}
                        >
                          {showComments ? 'Hide comments' : `Comments (${post.commentsCount})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLikes(post.id)}
                          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#1E40AF', background: 'rgba(30,64,175,0.12)', border: 'none', borderRadius: 999, padding: '6px 10px', cursor: 'pointer' }}
                        >
                          {showLikes ? 'Hide likes' : `Likes (${post.likesCount})`}
                        </button>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEdit(post)}
                            disabled={setupRequired}
                            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 999, padding: '6px 10px', cursor: setupRequired ? 'not-allowed' : 'pointer' }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={setupRequired || isDeleting || isSaving}
                          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#FAF8F4', background: isDeleting ? '#F87171' : '#DC2626', border: 'none', borderRadius: 999, padding: '6px 10px', cursor: setupRequired || isDeleting || isSaving ? 'not-allowed' : 'pointer' }}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        <input
                          value={titleValue}
                          onChange={e => setDrafts(prev => ({ ...prev, [post.id]: { title: e.target.value, body: bodyValue } }))}
                          style={{ width: '100%', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 10, padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', outline: 'none' }}
                        />
                        <textarea
                          value={bodyValue}
                          onChange={e => setDrafts(prev => ({ ...prev, [post.id]: { title: titleValue, body: e.target.value } }))}
                          rows={4}
                          style={{ width: '100%', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 12, padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', outline: 'none', lineHeight: 1.6 }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleSave(post.id)}
                            disabled={isSaving}
                            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#FAF8F4', background: '#2D6A4F', border: 'none', borderRadius: 999, padding: '8px 12px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                          >
                            {isSaving ? 'Saving...' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#1C1410', background: '#F6F2EB', border: 'none', borderRadius: 999, padding: '8px 12px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#3F352E', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {getBlogBodyText(post.body)}
                      </div>
                    )}

                    {showComments && (
                      <div style={{ marginTop: 12, background: '#fff', borderRadius: 12, padding: 12 }}>
                        {rootComments.length === 0 ? (
                          <div style={{ fontSize: 12, color: '#7A7068' }}>No comments yet.</div>
                        ) : (
                          <div style={{ display: 'grid', gap: 10 }}>
                            {renderCommentList(rootComments, 0)}
                          </div>
                        )}
                      </div>
                    )}

                    {showLikes && (
                      <div style={{ marginTop: 12, background: '#fff', borderRadius: 12, padding: 12 }}>
                        {likeUsers.length === 0 ? (
                          <div style={{ fontSize: 12, color: '#7A7068' }}>
                            {post.likesCount === 0 ? 'No likes yet.' : 'Likes recorded. User list unavailable.'}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {likeUsers.map(user => (
                              <span key={user.id} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#1C1410', background: '#F6F2EB', padding: '6px 10px', borderRadius: 999 }}>
                                {user.name}
                              </span>
                            ))}
                            {post.likesCount > likeUsers.length && (
                              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#5C524A', background: '#F6F2EB', padding: '6px 10px', borderRadius: 999 }}>
                                +{post.likesCount - likeUsers.length} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
