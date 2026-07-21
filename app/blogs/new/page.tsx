import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type BlogUserSummary } from '@/lib/blogs'
import BlogEditor from '../editor/blog-editor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New Post | SproutNet',
  description: 'Write and publish a new blog post on SproutNet.',
}

export default async function NewBlogPostPage() {
  let viewer: BlogUserSummary | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, name, role, dept, year')
        .eq('id', user.id)
        .single()

      if (profile) viewer = profile as BlogUserSummary
    }
  } catch {}

  if (!viewer) {
    redirect('/login')
  }

  const dashboardHref = viewer.role === 'poster' ? '/poster/dashboard' : '/dashboard'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Nav */}
      <nav style={{
        minHeight: 62,
        padding: '10px clamp(14px, 4vw, 48px)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.95)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F" />
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723" />
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)" />
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: '#1C1410' }}>SproutNet</span>
        </Link>

        <div className="sn-nav-actions" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
          <Link href="/blogs/manage" style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38', textDecoration: 'none' }}>← My Posts</Link>
          <Link href={dashboardHref} style={{ fontSize: 13, fontWeight: 700, color: '#1C1410', background: '#F4A723', padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>
            Dashboard →
          </Link>
        </div>

        <details className="sn-mobile-menu">
          <summary aria-label="Open navigation menu">
            <span className="sn-menu-icon" aria-hidden="true"></span>
            <span className="sn-menu-label">Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            <Link href="/blogs/manage">← My Posts</Link>
            <Link href={dashboardHref} className="sn-menu-primary">Dashboard →</Link>
          </div>
        </details>
      </nav>

      <BlogEditor viewer={viewer} />
    </div>
  )
}
