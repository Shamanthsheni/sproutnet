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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(28px, 6vw, 38px)',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {submissions.map(sub => (
              <div key={sub.id} style={{
                background: '#fff',
                border: '1.5px solid rgba(28,20,16,0.07)',
                borderRadius: 12,
                padding: 'clamp(18px, 3vw, 22px)'
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9CA3A0', marginBottom: 10 }}>
                  {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, color: '#1C1410', marginBottom: 6 }}>
                  {sub.problems?.title ?? 'Problem'}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#4A3F38', marginBottom: 12 }}>
                  {sub.problems?.domain ?? '—'}
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
  )
}
