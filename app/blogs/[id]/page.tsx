'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type BlogFeedPost, getBlogBodyText } from '@/lib/blogs'
import { useEditor, EditorContent } from '@tiptap/react'
import { buildExtensions } from '../editor/extensions'

const POST_TYPE_META: Record<string, { label: string; accent: string; background: string }> = {
  knowledge: { label: 'Knowledge Share', accent: '#2D6A4F', background: '#EAF4EE' },
  question: { label: 'Question / Doubt', accent: '#1E40AF', background: 'rgba(30,64,175,0.08)' },
}

function BlogBodyRenderer({ body }: { body: string }) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  let parsedContent: any = null
  try {
    const trimmed = body.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      parsedContent = JSON.parse(trimmed)
    }
  } catch {}

  const editor = useEditor({
    extensions: buildExtensions(),
    content: parsedContent,
    editable: false,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor || !parsedContent) return
    editor.commands.setContent(parsedContent, { emitUpdate: false })
  }, [editor, parsedContent])

  if (!isClient) return null

  if (!parsedContent) {
    return <div style={{ fontSize: 16, color: '#3F352E', lineHeight: 1.9, whiteSpace: 'pre-wrap', marginBottom: 32 }}>{body}</div>
  }

  return (
    <div className="sn-blog-body" style={{ marginBottom: 32 }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .sn-blog-body {
              font-family: 'DM Sans', sans-serif;
              font-size: 16px;
              line-height: 1.9;
              color: #3F352E;
            }
            .sn-blog-body .ProseMirror {
              outline: none;
              padding: 0;
            }
            .sn-blog-body h1, .sn-blog-body h2, .sn-blog-body h3 {
              font-family: 'Sora', sans-serif;
              color: #1C1410;
              line-height: 1.25;
              margin-top: 1.6em;
              margin-bottom: 0.5em;
            }
            .sn-blog-body h1 { font-size: 2rem; font-weight: 700; }
            .sn-blog-body h2 { font-size: 1.5rem; font-weight: 700; border-bottom: 1.5px solid rgba(28,20,16,0.08); padding-bottom: 0.3em; }
            .sn-blog-body h3 { font-size: 1.2rem; font-weight: 600; }
            .sn-blog-body p { margin: 0 0 1em; }
            .sn-blog-body ul, .sn-blog-body ol { padding-left: 1.7em; margin: 0.5em 0 1em; }
            .sn-blog-body li { margin: 0.3em 0; }
            .sn-blog-body blockquote { border-left: 4px solid #F4A723; padding-left: 18px; margin: 1.5em 0; color: #5C524A; font-style: italic; }
            .sn-blog-body pre { background: #1C1410; border-radius: 12px; padding: 20px 22px; overflow-x: auto; margin: 1.5em 0; color: #FAF8F4; font-family: 'JetBrains Mono', monospace; font-size: 0.88rem; line-height: 1.7; }
            .sn-blog-body img { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 1.5em auto; box-shadow: 0 4px 20px rgba(28,20,16,0.12); }
          `,
        }}
      />
      <EditorContent editor={editor} />
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<BlogFeedPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentInput, setCommentInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [comments, setComments] = useState<BlogFeedPost['comments']>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', user.id)
          .single()
        setCurrentUser(profile)
      }

      const postRes = await fetch(`/api/blogs/posts?id=${id}`)
      if (postRes.ok) {
        const data = await postRes.json()
        setPost(data.post)
        setLiked(data.post.likedByViewer)
        setLikeCount(data.post.likesCount)
        setComments(data.post.comments || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleDeleteComment(commentId: string) {
    if (!currentUser) return
    if (!window.confirm('Delete this comment? Replies under it will also be removed.')) return

    const res = await fetch('/api/blogs/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId }),
    })

    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId))
    } else {
      const text = await res.text().catch(() => '')
      let message = `Could not delete the comment (${res.status}).`
      try {
        message = JSON.parse(text)?.error ?? message
      } catch { /* keep default */ }
      window.alert(message)
    }
  }

  async function handleLike() {
    if (!currentUser) { router.push('/login'); return }
    const res = await fetch('/api/blogs/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id }),
    })
    if (res.ok) {
      const data = await res.json()
      setLiked(data.liked)
      setLikeCount(prev => data.liked ? prev + 1 : Math.max(0, prev - 1))
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentInput.trim() || posting) return
    setPosting(true)
    const res = await fetch('/api/blogs/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id, body: commentInput.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.comment) {
        setComments(prev => [...prev, data.comment])
        setCommentInput('')
      } else {
        router.refresh()
        setCommentInput('')
      }
    }
    setPosting(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ fontSize: 14, color: '#9CA3A0' }}>Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 18, color: '#1C1410', fontWeight: 700 }}>Post not found</div>
        <Link href="/blogs" style={{ fontSize: 14, color: '#2D6A4F', textDecoration: 'none' }}>← Back to blogs</Link>
      </div>
    )
  }

  const meta = POST_TYPE_META[post.postType] || POST_TYPE_META.knowledge

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{
        padding: '12px clamp(16px, 4vw, 52px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(250,248,244,0.94)', borderBottom: '1px solid rgba(28,20,16,0.07)'
      }}>
        <Link href="/blogs" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1C1410', fontWeight: 600 }}>
          ← Back to Blogs
        </Link>
        {currentUser ? (
          <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>
            Dashboard →
          </Link>
        ) : (
          <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>
            Log in →
          </Link>
        )}
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
        {post.cover_image && (
          <div style={{ width: '100%', height: 320, borderRadius: 16, overflow: 'hidden', marginBottom: 24, background: '#F6F2EB' }}>
            <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: meta.background, color: meta.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
            {initials(post.author?.name ?? 'SN')}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410' }}>{post.author?.name ?? 'SproutNet member'}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: meta.accent, background: meta.background, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.label}</span>
            </div>
            <div style={{ fontSize: 13, color: '#7A7068' }}>{formatDate(post.createdAt)}</div>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 400, color: '#1C1410', lineHeight: 1.05, letterSpacing: '-0.7px', marginBottom: 24 }}>
          {post.title}
        </h1>

        <BlogBodyRenderer body={post.body} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid rgba(28,20,16,0.07)', borderBottom: '1px solid rgba(28,20,16,0.07)', marginBottom: 32 }}>
          {currentUser ? (
            <button onClick={handleLike} style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700,
              color: liked ? '#1C1410' : '#7A7068', background: liked ? '#F4A723' : '#F6F2EB',
              border: 'none', borderRadius: 999, padding: '10px 18px', cursor: 'pointer'
            }}>
              {liked ? `Liked - ${likeCount}` : `Like - ${likeCount}`}
            </button>
          ) : (
            <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: '#2D6A4F', background: '#F6F2EB', borderRadius: 999, padding: '10px 18px', textDecoration: 'none' }}>
              Log in to like - {likeCount}
            </Link>
          )}
          <span style={{ fontSize: 13, color: '#7A7068' }}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 16 }}>Discussion</h3>

          {currentUser && (
            <form onSubmit={handleComment} style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
              <textarea
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                style={{ width: '100%', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 12, padding: '12px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', resize: 'vertical', outline: 'none', lineHeight: 1.65 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={posting || !commentInput.trim()} style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#FAF8F4',
                  background: '#2D6A4F', border: 'none', borderRadius: 10, padding: '10px 16px',
                  cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.6 : 1
                }}>
                  {posting ? 'Posting...' : 'Post comment'}
                </button>
              </div>
            </form>
          )}

          {comments.length === 0 ? (
            <div style={{ fontSize: 14, color: '#7A7068' }}>{currentUser ? 'No comments yet. Be the first!' : 'No comments yet.'}</div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {comments.filter(c => !c.parentId).map(comment => {
                const canDelete = currentUser?.id != null && comment.author?.id === currentUser.id
                return (
                <div key={comment.id}>
                  <div style={{ background: '#fff', border: '1px solid rgba(28,20,16,0.06)', borderRadius: 14, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#1C1410' }}>{comment.author?.name ?? 'SproutNet member'}</span>
                      <span style={{ fontSize: 11, color: '#8A8078' }}>{formatDate(comment.createdAt)}</span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Delete comment"
                          style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#DC2626', background: 'none', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: '#3F352E', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{comment.body}</div>
                  </div>
                  {comments.filter(c => c.parentId === comment.id).map(reply => {
                    const canDeleteReply = currentUser?.id != null && reply.author?.id === currentUser.id
                    return (
                    <div key={reply.id} style={{ marginLeft: 24, marginTop: 10, paddingLeft: 16, borderLeft: '2px solid rgba(28,20,16,0.06)' }}>
                      <div style={{ background: '#fff', border: '1px solid rgba(28,20,16,0.06)', borderRadius: 14, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#1C1410' }}>{reply.author?.name ?? 'SproutNet member'}</span>
                          <span style={{ fontSize: 11, color: '#8A8078' }}>{formatDate(reply.createdAt)}</span>
                          {canDeleteReply && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(reply.id)}
                              title="Delete reply"
                              style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#DC2626', background: 'none', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 14, color: '#3F352E', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{reply.body}</div>
                      </div>
                    </div>
                  )})}
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
