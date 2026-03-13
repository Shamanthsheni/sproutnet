import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type EnrolledProblem = {
  id: string
  title: string
  domain: string
  problem_type: string
  deadline: string
  milestones: number
  status: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'poster') redirect('/poster/dashboard')

  const isStudent = profile.role === 'student'
  const isAdmin = profile.role === 'admin'
  let enrolledProblems: Array<EnrolledProblem & { hasSubmission: boolean }> = []

  if (isStudent) {
    const { data: enrollmentRows } = await admin
      .from('enrollments')
      .select('problem_id, created_at')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const problemIds = Array.from(
      new Set((enrollmentRows ?? []).map(row => row.problem_id).filter(Boolean))
    )

    if (problemIds.length > 0) {
      const [{ data: problemRows }, { data: submissionRows }] = await Promise.all([
        admin
          .from('problems')
          .select('id, title, domain, problem_type, deadline, milestones, status')
          .in('id', problemIds),
        admin
          .from('submissions')
          .select('problem_id')
          .eq('student_id', user.id)
          .in('problem_id', problemIds),
      ])

      const order = new Map(problemIds.map((problemId, index) => [problemId, index]))
      const submittedProblemIds = new Set((submissionRows ?? []).map(row => row.problem_id))

      enrolledProblems = ((problemRows ?? []) as EnrolledProblem[])
        .map(problem => ({
          ...problem,
          hasSubmission: submittedProblemIds.has(problem.id),
        }))
        .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F4',
      fontFamily: 'DM Sans, sans-serif'
    }}>

      {/* Nav */}
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
        zIndex: 100
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>
            SproutNet
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', rowGap: 8 }}>
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
            {profile.is_master ? 'Master Admin' : profile.role}
          </span>
          <span style={{ fontSize: 14, color: '#4A3F38' }}>{profile.name}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#9CA3A0',
              background: 'none',
              border: '1px solid rgba(28,20,16,0.12)',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer'
            }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(30px, 6vw, 42px)',
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Good to see you, {profile.name.split(' ')[0]}.
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300 }}>
            {isStudent && 'Browse open problems and start building.'}
            {isAdmin && 'Manage the platform — approve problems, judge submissions.'}
          </p>
        </div>

        {/* Role-based stats */}
        {isStudent && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
            {[
              { label: 'Builder Score', value: profile.builder_score ?? 0, accent: '#F4A723' },
              { label: 'Problems Attempted', value: profile.attempted ?? 0, accent: '#2D6A4F' },
              { label: 'Avg Score', value: profile.avg_score ? Number(profile.avg_score).toFixed(1) : '—', accent: '#2D6A4F' },
              { label: 'Milestones Done', value: profile.milestones_done ?? 0, accent: '#2D6A4F' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#fff',
                border: '1.5px solid rgba(28,20,16,0.07)',
                borderRadius: 12,
                padding: '24px',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 28,
                  fontWeight: 500,
                  color: stat.accent,
                  marginBottom: 6
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {isStudent && (
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 18
            }}>
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: '#2D6A4F',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 8
                }}>
                  {'// enrolled problems'}
                </div>
                <h2 style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#1C1410'
                }}>
                  Keep building where you left off
                </h2>
              </div>

              <Link href="/problems" style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#2D6A4F',
                textDecoration: 'none'
              }}>
                Browse more problems →
              </Link>
            </div>

            {enrolledProblems.length === 0 ? (
              <div style={{
                background: '#fff',
                border: '1.5px solid rgba(28,20,16,0.07)',
                borderRadius: 16,
                padding: '28px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🧭</div>
                <div style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#1C1410',
                  marginBottom: 8
                }}>
                  No enrolled problems yet
                </div>
                <div style={{ fontSize: 14, color: '#9CA3A0', marginBottom: 18 }}>
                  Enroll in a problem and it will appear here so you can jump back in quickly.
                </div>
                <Link href="/problems" style={{
                  display: 'inline-block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1C1410',
                  background: '#F4A723',
                  padding: '12px 20px',
                  borderRadius: 8,
                  textDecoration: 'none'
                }}>
                  Explore Open Problems →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                {enrolledProblems.map(problem => {
                  const typeLabel = problem.problem_type === 'industry_challenge' ? 'Industry Challenge' : 'Public Impact'

                  return (
                    <div key={problem.id} style={{
                      background: '#fff',
                      border: '1.5px solid rgba(28,20,16,0.07)',
                      borderRadius: 16,
                      padding: '22px'
                    }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#2D6A4F',
                          background: '#EAF4EE',
                          border: '1px solid rgba(45,106,79,0.15)',
                          padding: '4px 10px',
                          borderRadius: 999
                        }}>
                          {problem.domain}
                        </span>
                        <span style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#4A3F38',
                          background: 'rgba(28,20,16,0.05)',
                          border: '1px solid rgba(28,20,16,0.1)',
                          padding: '4px 10px',
                          borderRadius: 999
                        }}>
                          {typeLabel}
                        </span>
                      </div>

                      <div style={{
                        fontFamily: 'Sora, sans-serif',
                        fontSize: 17,
                        fontWeight: 700,
                        color: '#1C1410',
                        marginBottom: 10
                      }}>
                        {problem.title}
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 12,
                        marginBottom: 18
                      }}>
                        <div>
                          <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 11,
                            color: '#9CA3A0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4
                          }}>
                            Deadline
                          </div>
                          <div style={{ fontSize: 14, color: '#1C1410' }}>
                            {new Date(problem.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 11,
                            color: '#9CA3A0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4
                          }}>
                            Progress
                          </div>
                          <div style={{ fontSize: 14, color: '#1C1410' }}>
                            {problem.milestones} milestones
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11,
                          color: problem.status === 'open' ? '#2D6A4F' : '#9CA3A0',
                          background: problem.status === 'open' ? '#EAF4EE' : 'rgba(28,20,16,0.06)',
                          padding: '6px 10px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em'
                        }}>
                          {problem.status}
                        </span>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Link href={`/problems/${problem.id}`} style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#2D6A4F',
                            textDecoration: 'none'
                          }}>
                            View problem
                          </Link>
                          <Link href={`/problems/${problem.id}/submit`} style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1C1410',
                            background: '#F4A723',
                            padding: '10px 14px',
                            borderRadius: 8,
                            textDecoration: 'none'
                          }}>
                            {problem.hasSubmission ? 'Continue Solving →' : 'Start Solving →'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {isStudent && (
            <>
              <ActionCard href="/problems" icon="🔍" title="Browse Problems" desc="See all open problems across 8 domains." />
              <ActionCard href="/leaderboard" icon="🏆" title="Leaderboard" desc="See where you stand this season." />
              <ActionCard href={`/profile/${profile.profile_slug}`} icon="👤" title="Your Profile" desc="View your public builder profile." />
            </>
          )}
          {isAdmin && (
            <>
              <ActionCard href="/admin/problems" icon="✅" title="Approve Problems" desc="Review and approve pending problem posts." />
              <ActionCard href="/admin/judging" icon="⚖️" title="Judge Submissions" desc="Score submissions assigned to admin." />
              <ActionCard href="/admin/analytics" icon="📊" title="Analytics" desc="Platform-wide stats and domain breakdown." />
            </>
          )}
        </div>

      </div>
    </div>
  )
}

function ActionCard({ href, icon, title, desc }: {
  href: string
  icon: string
  title: string
  desc: string
}) {
  return (
    <Link href={href} style={{
      background: '#fff',
      border: '1.5px solid rgba(28,20,16,0.07)',
      borderRadius: 12,
      padding: 'clamp(20px, 3vw, 28px)',
      textDecoration: 'none',
      display: 'block',
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: 15,
        fontWeight: 600,
        color: '#1C1410',
        marginBottom: 6
      }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#4A3F38', fontWeight: 300, lineHeight: 1.5 }}>
        {desc}
      </div>
    </Link>
  )
}
