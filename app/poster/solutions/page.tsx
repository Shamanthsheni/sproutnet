import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type SubmissionRow = {
  id: string
  stage: string
  milestone: number
  status: string
  created_at: string
  problem_id: string
  student_id: string
  problems?: { title: string; domain: string } | null
  users?: { name: string; dept: string; year: string } | null
}

export default async function PosterSolutionsPage() {
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

  const { data: problems } = await supabase
    .from('problems')
    .select('id, title, domain')
    .eq('poster_id', user.id)

  const problemIds = (problems ?? []).map(p => p.id)

  let submissions: SubmissionRow[] = []
  if (problemIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, stage, milestone, status, created_at, problem_id, student_id, problems(title, domain), users(name, dept, year)')
      .in('problem_id', problemIds)
      .order('created_at', { ascending: false })
    submissions = (data ?? []) as unknown as SubmissionRow[]
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{
        height: 66, padding: '0 52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/poster/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 38,
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Student solutions
          </h1>
          <p style={{ fontSize: 15, color: '#4A3F38', fontWeight: 300 }}>
            Solutions submitted by students for your posted problems.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: 12,
            border: '1.5px solid rgba(28,20,16,0.07)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
            <div style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 18, fontWeight: 600,
              color: '#1C1410', marginBottom: 8
            }}>
              No submissions yet
            </div>
            <div style={{ fontSize: 14, color: '#9CA3A0' }}>
              Once students submit solutions, they will appear here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {submissions.map(sub => (
              <div key={sub.id} style={{
                background: '#fff',
                border: '1.5px solid rgba(28,20,16,0.07)',
                borderRadius: 12,
                padding: '22px'
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9CA3A0', marginBottom: 10 }}>
                  {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, color: '#1C1410', marginBottom: 6 }}>
                  {sub.problems?.title ?? 'Problem'}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#4A3F38', marginBottom: 12 }}>
                  {sub.problems?.domain ?? '—'} · Milestone {sub.milestone} · {sub.stage}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#2D6A4F', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontFamily: 'Sora, sans-serif',
                    fontSize: 11, fontWeight: 700
                  }}>
                    {sub.users?.name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#1C1410' }}>
                      {sub.users?.name ?? 'Student'}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9CA3A0' }}>
                      {(sub.users?.dept ?? 'Department')} · {(sub.users?.year ?? 'Year')}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  color: '#2D6A4F', background: '#EAF4EE',
                  padding: '4px 10px', borderRadius: 999
                }}>
                  Status: {sub.status ?? 'pending'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
