'use client'

import Link from 'next/link'
import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BLOGS_SETUP_REQUIRED_MESSAGE,
  BLOGS_SETUP_SQL_PATH,
  isBlogBodyEmpty,
  getBlogBodyText,
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
  const [submittingPost, setSubmittingPost] = useState(false)
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

    if (!postTitle.trim()) {
      setActionError('Post title is required.')
      return
    }
    if (isBlogBodyEmpty(postBody)) {
      setActionError('Post body cannot be empty.')
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
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Link
                        href="/blogs/new"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#2D6A4F', background: 'rgba(45,106,79,0.1)', padding: '10px 16px', borderRadius: 10, textDecoration: 'none' }}
                      >
                        Rich editor →
                      </Link>
                      <span style={{ fontSize: 11, color: '#8A8078' }}>For longer posts with images</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreatePost}
                      disabled={submittingPost}
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1410', background: submittingPost ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: submittingPost ? 'not-allowed' : 'pointer', boxShadow: '0 8px 18px rgba(244,167,35,0.22)' }}
                    >
                      {submittingPost ? 'Publishing...' : 'Quick Publish →'}
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
              const plainBody = getBlogBodyText(post.body)
              const excerpt = post.excerpt || plainBody.substring(0, 250) + (plainBody.length > 250 ? '...' : '')

              return (
                <Link key={post.id} href={`/blogs/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <article style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 20, padding: 22, boxShadow: '0 12px 30px rgba(28,20,16,0.04)', cursor: 'pointer' }}>
                    {post.cover_image && (
                      <div style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 16, background: '#F6F2EB' }}>
                        <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
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
                        {post.commentsCount} comment{post.commentsCount === 1 ? '' : 's'} · {post.likesCount} like{post.likesCount === 1 ? '' : 's'}
                      </div>
                    </div>

                    <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: '#1C1410', lineHeight: 1.2, marginBottom: 12 }}>{post.title}</h2>
                    <p style={{ fontSize: 15, color: '#3F352E', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 0 }}>{excerpt}</p>
                  </article>
                </Link>
              )
            })
          )
        )}
      </div>

      {showSidebar && (
        <aside style={{ display: 'grid', gap: 18 }}>
          <section style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 18, padding: 22 }}>

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
