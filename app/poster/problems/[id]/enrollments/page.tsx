import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PosterEnrollmentsList from './poster-enrollments-list'

export default async function PosterEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/poster')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login/poster')
  if (profile.role !== 'poster') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: problem } = await admin
    .from('problems')
    .select('id, title, poster_id')
    .eq('id', id)
    .single()

  if (!problem || problem.poster_id !== user.id) {
    redirect('/poster/problems')
  }

  const { data: enrollments } = await admin
    .from('enrollments')
    .select('id, created_at, student_id, status, users(name, dept, year)')
    .eq('problem_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{
        height: 66, padding: '0 52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/poster/problems" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#2D6A4F',
            background: '#EAF4EE',
            padding: '4px 12px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Poster
          </span>
          <span style={{ fontSize: 14, color: '#4A3F38' }}>{profile.name}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 34,
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Enrollments
          </h1>
          <p style={{ fontSize: 14, color: '#4A3F38', fontWeight: 300 }}>
            {problem.title}
          </p>
        </div>

        <PosterEnrollmentsList enrollments={(enrollments ?? []) as any} problemId={id} />
      </div>
    </div>
  )
}
