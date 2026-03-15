import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { type BlogUserSummary } from '@/lib/blogs'
import { getBlogFeed } from '@/lib/blogs.server'
import BlogsFeed from '../blogs-feed'
import MyPostsPanel from './my-posts-panel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Blogs | SproutNet',
  description: 'Write new posts and track everything you have shared so far.',
}

export default async function BlogsManagePage() {
  let viewer: BlogUserSummary | null = null
  let userId: string | null = null

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

      if (profile) {
        viewer = profile as BlogUserSummary
      }
    }
  } catch {}

  const { posts, error, setupRequired } = await getBlogFeed(userId)
  const myPosts = viewer ? posts.filter(post => post.author?.id === viewer.id) : []
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
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
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
      <nav style={{
        minHeight: 66,
        height: 'auto',
        padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: 10,
        columnGap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F" />
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723" />
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)" />
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>

        <div className="sn-nav-actions" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
          <Link href="/problems" style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38', textDecoration: 'none' }}>Problems</Link>
          <Link href="/blogs" style={{ fontSize: 14, fontWeight: 600, color: '#1C1410', textDecoration: 'none' }}>Blogs</Link>
          <Link href="/leaderboard" style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38', textDecoration: 'none' }}>Leaderboard</Link>
          <Link href={dashboardHref} style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1C1410',
            background: '#F4A723',
            padding: '8px 20px',
            borderRadius: 6,
            textDecoration: 'none',
          }}>
            {viewer ? 'Dashboard ->' : 'Log in ->'}
          </Link>
        </div>

        <details className="sn-mobile-menu">
          <summary aria-label="Open navigation menu">
            <span className="sn-menu-icon" aria-hidden="true"></span>
            <span className="sn-menu-label">Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            <Link href="/problems">Problems</Link>
            <Link href="/blogs">Blogs</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href={dashboardHref} className="sn-menu-primary">
              {viewer ? 'Dashboard ->' : 'Log in ->'}
            </Link>
          </div>
        </details>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
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
    </div>
  )
}
