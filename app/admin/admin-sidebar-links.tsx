'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/admin', label: 'Overview', meta: 'home' },
  { href: '/admin/problems', label: 'Problems', meta: 'moderation' },
  { href: '/admin/solutions', label: 'Solutions', meta: 'uploads' },
  { href: '/admin/judging', label: 'Judging', meta: 'queue' },
  { href: '/admin/analytics', label: 'Analytics', meta: 'metrics' },
  { href: '/leaderboard', label: 'Leaderboard', meta: 'scores' },
] as const

export default function AdminSidebarLinks() {
  const pathname = usePathname()
  const [busy, setBusy] = useState<'seed' | 'recalc' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  async function handleSeed() {
    setBusy('seed')
    setMsg(null)
    try {
      const res = await fetch('/api/leaderboard/seed', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setMsg(`✅ ${data.summary}`)
      } else {
        setMsg(`❌ ${data.error ?? 'Seed failed'}`)
      }
    } catch {
      setMsg('❌ Network error')
    }
    setBusy(null)
  }

  async function handleRecalc() {
    setBusy('recalc')
    setMsg(null)
    try {
      const res = await fetch('/api/leaderboard/recalculate', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setMsg(`✅ ${data.message}`)
      } else {
        setMsg(`❌ ${data.error ?? 'Recalc failed'}`)
      }
    } catch {
      setMsg('❌ Network error')
    }
    setBusy(null)
  }

  return (
    <div>
      <div style={{ display: 'grid', gap: 8 }}>
        {LINKS.map(link => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-sidebar-link${active ? ' admin-sidebar-link--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                {link.label}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                {link.meta}
              </span>
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-primary)', display: 'grid', gap: 6 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          LEADERBOARD TOOLS
        </div>
        <button
          type="button"
          disabled={busy === 'seed'}
          onClick={handleSeed}
          style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
            color: 'var(--text-primary)', background: 'transparent',
            border: '1px solid var(--border-primary)', borderRadius: 8,
            padding: '8px 12px', cursor: busy === 'seed' ? 'not-allowed' : 'pointer',
            textAlign: 'left', opacity: busy === 'seed' ? 0.6 : 1,
          }}
        >
          {busy === 'seed' ? 'Seeding...' : 'Seed Test Submissions'}
        </button>
        <button
          type="button"
          disabled={busy === 'recalc'}
          onClick={handleRecalc}
          style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
            color: 'var(--text-primary)', background: 'transparent',
            border: '1px solid var(--border-primary)', borderRadius: 8,
            padding: '8px 12px', cursor: busy === 'recalc' ? 'not-allowed' : 'pointer',
            textAlign: 'left', opacity: busy === 'recalc' ? 0.6 : 1,
          }}
        >
          {busy === 'recalc' ? 'Recalculating...' : 'Recalculate Scores'}
        </button>
        {msg && (
          <div style={{ fontSize: 11, color: msg.startsWith('✅') ? '#34D399' : '#F87171', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.4 }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}

