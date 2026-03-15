import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { type BlogUserSummary } from '@/lib/blogs'
import { getBlogFeed } from '@/lib/blogs.server'
import BlogsFeed from './blogs-feed'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blogs | SproutNet',
  description: 'Share knowledge, ask questions, and learn from the community.',
}

export default async function BlogsPage() {
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
  const dashboardHref = !viewer ? '/login' : viewer.role === 'poster' ? '/poster/dashboard' : '/dashboard'

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
            @media (max-width: 980px) {
              .blogs-layout {
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
            {viewer ? 'Dashboard →' : 'Log in →'}
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
              {viewer ? 'Dashboard →' : 'Log in →'}
            </Link>
          </div>
        </details>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
        <section style={{
          background: 'linear-gradient(135deg, #1C1410 0%, #2B211B 52%, #2D6A4F 100%)',
          borderRadius: 24,
          padding: 'clamp(24px, 5vw, 40px)',
          marginBottom: 28,
          color: '#FAF8F4',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            inset: 'auto -40px -50px auto',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,167,35,0.24) 0%, rgba(244,167,35,0) 70%)',
          }} />
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(250,248,244,0.48)',
            marginBottom: 16,
          }}>
            {'// community blog feed'}
          </div>
          <div style={{ maxWidth: 760 }}>
            <h1 style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(34px, 7vw, 58px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.7px',
              marginBottom: 16,
            }}>
              Share what you know.
              <br />
              Ask what you don&apos;t.
            </h1>
            <p style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: 'rgba(250,248,244,0.78)',
              maxWidth: 620,
            }}>
              Blogs is the open feed for builder notes, lessons learned, sharp questions, and community help.
              Every post lands in one shared stream so other users can read, like, and comment.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
              <Link href="/blogs/manage" style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: '#1C1410',
                background: '#F4A723',
                padding: '10px 18px',
                borderRadius: 10,
                textDecoration: 'none',
              }}>
                Write and manage posts
              </Link>
            </div>
          </div>
        </section>

        <BlogsFeed
          viewer={viewer}
          initialPosts={posts}
          loadError={error}
          setupRequired={setupRequired}
          showComposer={false}
          showSidebar={false}
        />
      </div>
    </div>
  )
}
