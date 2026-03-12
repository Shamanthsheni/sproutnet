import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import './admin.css'
import AdminSidebarLinks from './admin-sidebar-links'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name, is_master')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'admin') {
    if (profile.role === 'poster') redirect('/poster/dashboard')
    redirect('/dashboard')
  }

  return (
    <div className="admin-theme admin-shell">
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>

        {/* Sidebar */}
        <aside style={{
          borderRight: '1px solid var(--border-primary)',
          background: 'var(--bg-surface)',
          padding: '22px 18px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto'
        }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 18 }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true" style={{
              flexShrink: 0,
              filter: 'drop-shadow(0 10px 26px rgba(16,163,127,0.18))'
            }}>
              <rect width="34" height="34" rx="8" fill="var(--accent-primary)" />
              <line x1="17" y1="27" x2="17" y2="15" stroke="#0D0D0D" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F59E0B" />
              <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(236,236,236,0.88)" />
            </svg>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                SproutNet
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                admin panel
              </div>
            </div>
          </Link>

          <div className="admin-card" style={{ padding: '12px 12px', marginBottom: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(148,163,184,0.8)', marginBottom: 8 }}>
              YOUR ACCESS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name}
              </div>
              <span className="admin-pill admin-pill--accent" style={{ flexShrink: 0 }}>
                {profile.is_master ? 'MASTER' : 'ADMIN'}
              </span>
            </div>
          </div>

          <AdminSidebarLinks />

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
            <Link href="/dashboard" className="admin-sidebar-link" style={{ justifyContent: 'center' }}>
              ← Back to Dashboard
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div>
          <header style={{
            height: 64,
            padding: '0 26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid var(--border-primary)',
            background: 'rgba(246,247,248,0.9)',
            backdropFilter: 'blur(8px)',
            position: 'sticky',
            top: 0,
            zIndex: 50
          }}>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="admin-btn">
                Sign out
              </button>
            </form>
          </header>

          <main style={{ padding: '28px 26px 70px' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
