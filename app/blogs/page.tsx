import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { type BlogUserSummary } from '@/lib/blogs'
import { getBlogFeed } from '@/lib/blogs.server'
import BlogsFeed from './blogs-feed'
import Navbar from '@/app/components/navbar'

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
      <Navbar user={viewer} />

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
              Read the full feed and comments without logging in. To publish, like, or comment, sign in.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
              {viewer ? (
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
              ) : (
                <>
                  <Link href="/login" style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#1C1410',
                    background: '#F4A723',
                    padding: '10px 18px',
                    borderRadius: 10,
                    textDecoration: 'none',
                  }}>
                    Log in to post
                  </Link>
                  <Link href="/join" style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#FAF8F4',
                    background: 'rgba(250,248,244,0.18)',
                    border: '1px solid rgba(250,248,244,0.35)',
                    padding: '10px 18px',
                    borderRadius: 10,
                    textDecoration: 'none',
                  }}>
                    Create account
                  </Link>
                </>
              )}
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
