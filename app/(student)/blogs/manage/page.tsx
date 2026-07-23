import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type BlogUserSummary, type BlogFeedPost, normalizeBlogSetupError, isMissingBlogTablesError } from '@/lib/blogs'
import { BLOGS_LOCAL_FALLBACK_ENABLED, getLocalBlogRows } from '@/lib/blogs-local.server'
import BlogsFeed from '@/app/blogs/blogs-feed'
import MyPostsPanel from './my-posts-panel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Blogs | SproutNet',
  description: 'Write new posts and track everything you have shared so far.',
}

export default async function BlogsManagePage() {
  let viewer: BlogUserSummary | null = null
  let userId: string | null = null

  // ── Step 1: get auth (fast, single cookie read) ──────────────────────────
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, name, role, dept, year')
        .eq('id', user.id)
        .single()
      if (profile) viewer = profile as BlogUserSummary
    }
  } catch {}

  // ── Step 2: fetch only this user's posts (no body, no comments, no likes) ─
  let myPosts: BlogFeedPost[] = []
  let error: string | null = null
  let setupRequired = false

  if (userId) {
    try {
      const admin = createAdminClient()

      // Stage 1: fetch only this user's posts (no body — not needed for manage view)
      const { data: postRows, error: postsError } = await admin
        .from('blog_posts')
        .select('id, title, post_type, created_at, author_id')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (postsError) {
        if (isMissingBlogTablesError(postsError.message)) {
          if (BLOGS_LOCAL_FALLBACK_ENABLED) {
            setupRequired = false
            const { posts: localPosts, comments: localComments, likes: localLikes } = await getLocalBlogRows()
            const userLocalPosts = localPosts.filter(p => p.author_id === userId)
            myPosts = userLocalPosts.map(post => {
              const postComments = localComments.filter(c => c.post_id === post.id)
              const postLikes = localLikes.filter(l => l.post_id === post.id)
              return {
                id: post.id,
                title: post.title,
                body: post.body,
                postType: post.post_type === 'question' ? 'question' : 'knowledge',
                createdAt: post.created_at,
                author: viewer,
                likesCount: postLikes.length,
                commentsCount: postComments.length,
                likedByViewer: postLikes.some(l => l.user_id === userId),
                comments: [],
                cover_image: post.cover_image ?? null,
                excerpt: post.excerpt ?? null,
              } satisfies BlogFeedPost
            })
          } else {
            setupRequired = true
          }
        } else {
          error = normalizeBlogSetupError(postsError.message)
        }
      } else {
        const posts = postRows ?? []
        const postIds = posts.map(p => p.id)

        // Stage 2: fetch comments + likes for only those posts, in parallel
        const [commentsResult, likesResult] = postIds.length > 0
          ? await Promise.all([
              admin
                .from('blog_comments')
                .select('id, post_id, created_at, author_id')
                .in('post_id', postIds)
                .order('created_at', { ascending: true }),
              admin
                .from('blog_post_likes')
                .select('post_id, user_id')
                .in('post_id', postIds),
            ])
          : [{ data: [], error: null }, { data: [], error: null }]

        const comments = commentsResult.data ?? []
        const likes = likesResult.data ?? []

        // Group counts
        const commentCounts = new Map<string, number>()
        const likeCounts = new Map<string, number>()
        for (const c of comments) commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1)
        for (const l of likes) likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1)

        const likedByViewer = new Set(likes.filter(l => l.user_id === userId).map(l => l.post_id))

        myPosts = posts.map(post => ({
          id: post.id,
          title: post.title,
          body: '',
          postType: post.post_type === 'question' ? 'question' : 'knowledge',
          createdAt: post.created_at,
          author: viewer,
          likesCount: likeCounts.get(post.id) ?? 0,
          commentsCount: commentCounts.get(post.id) ?? 0,
          likedByViewer: likedByViewer.has(post.id),
          comments: [],
        } satisfies BlogFeedPost))
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not load your posts.'
    }
  }

  const dashboardHref = !viewer ? '/login' : viewer.role === 'poster' ? '/poster/dashboard' : '/dashboard'

  const emptyState = viewer
    ? {
        title: 'No posts from you yet',
        body: 'Write your first knowledge share or question. It will show up here once published.',
      }
    : {
        title: 'Log in to manage your posts',
        body: 'Sign in to publish new posts and see everything you have shared so far.',
      }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .blogs-layout {
              display: grid;
              grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);
              gap: 24px;
              align-items: start;
            }
            .blogs-manage-layout {
              display: grid;
              grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.9fr);
              gap: 24px;
              align-items: start;
            }
            @media (max-width: 980px) {
              .blogs-layout,
              .blogs-manage-layout {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />
        <section style={{
          background: '#fff',
          borderRadius: 24,
          padding: 'clamp(20px, 4vw, 32px)',
          marginBottom: 24,
          border: '1px solid rgba(28,20,16,0.08)',
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2D6A4F', marginBottom: 10 }}>
            {'// your blog desk'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 700, color: '#1C1410', marginBottom: 6 }}>
                Write new posts and track your history
              </div>
              <div style={{ fontSize: 14, color: '#5C524A' }}>
                Everything you publish appears here so you can refine, respond, and keep momentum.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/blogs/new" style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#1C1410',
                background: '#F4A723',
                padding: '10px 18px',
                borderRadius: 10,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(244,167,35,0.24)',
              }}>
                Write new post →
              </Link>
              <Link href="/blogs" style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#1C1410',
                background: '#F6F2EB',
                padding: '10px 16px',
                borderRadius: 10,
                textDecoration: 'none',
                border: '1px solid rgba(28,20,16,0.08)',
              }}>
                Back to feed
              </Link>
            </div>
          </div>
        </section>

        <div className="blogs-manage-layout">
          <BlogsFeed
            viewer={viewer}
            initialPosts={myPosts}
            loadError={error}
            setupRequired={setupRequired}
            showComposer
            showSidebar={false}
            showFeed={false}
            emptyState={emptyState}
          />
          <MyPostsPanel
            viewer={viewer}
            posts={myPosts}
            loadError={error}
            setupRequired={setupRequired}
          />
        </div>
      </div>
  )
}
