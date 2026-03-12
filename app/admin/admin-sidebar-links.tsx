'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Overview', meta: 'home' },
  { href: '/admin/problems', label: 'Problems', meta: 'moderation' },
  { href: '/admin/judging', label: 'Judging', meta: 'queue' },
  { href: '/admin/analytics', label: 'Analytics', meta: 'metrics' },
] as const

export default function AdminSidebarLinks() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
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
  )
}

