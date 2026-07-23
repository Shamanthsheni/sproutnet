import { redirect } from 'next/navigation'
import Link from 'next/link'
import { type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CancelEnrollmentButton from '@/app/components/cancel-enrollment-button'
import { MAX_ACTIVE_ENROLLMENTS, syncCompletedEnrollments } from '@/lib/enrollment-progress'

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
  if (profile.role === 'mentor') redirect('/mentor/dashboard')

  const isStudent = profile.role === 'student'
  const isAdmin = profile.role === 'admin'
  let enrolledProblems: Array<EnrolledProblem & { hasSubmission: boolean }> = []

  let workspaces: any[] = []
  if (isStudent) {
    const { data: memberRows } = await admin
      .from('team_members')
      .select('team_id, workspace_id, role, teams(id, name, problem_id, problems(title, domain))')
      .eq('user_id', user.id)
      .not('workspace_id', 'is', null)
      .order('created_at', { ascending: false })

    if (memberRows) {
      const wsIds = [...new Set(memberRows.map(r => r.workspace_id).filter(Boolean))]
      const { data: wsData } = await admin
        .from('workspaces')
        .select('id, name, status, last_activity_at')
        .in('id', wsIds)
        .neq('status', 'disbanded')

      const wsLookup = new Map((wsData || []).map(ws => [ws.id, ws]))

      const wsMap = new Map<string, any>()
      for (const row of memberRows) {
        const ws = wsLookup.get(row.workspace_id || '')
        if (ws && !wsMap.has(ws.id)) {
          const team = (row as any).teams
          wsMap.set(ws.id, {
            id: ws.id,
            name: ws.name || team?.name || 'Workspace',
            status: ws.status,
            team_id: row.team_id,
            team_name: team?.name,
            problem_title: team?.problems?.title,
            problem_domain: team?.problems?.domain,
            role: row.role,
            last_activity_at: ws.last_activity_at,
          })
        }
      }
      workspaces = Array.from(wsMap.values())
    }
  }

  if (isStudent) {
    await syncCompletedEnrollments(admin, user.id)

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
              { label: 'Solutions Completed', value: profile.milestones_done ?? 0, accent: '#2D6A4F' },
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
                <div style={{ fontSize: 13, color: '#7A7068', marginTop: 6 }}>
                  You can keep up to {MAX_ACTIVE_ENROLLMENTS} active problem enrollments at a time.
                </div>
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
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                  <CompassIcon size={36} />
                </div>
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
                        marginBottom: 18
                      }}>
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
                          <CancelEnrollmentButton
                            problemId={problem.id}
                            label="Cancel"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Student Workspaces */}
        {isStudent && workspaces.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18
            }}>
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8
                }}>
                  {'// team workspaces'}
                </div>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410' }}>
                  Your Workspaces
                </h2>
                <div style={{ fontSize: 13, color: '#7A7068', marginTop: 6 }}>
                  Collaborate with your team in your shared workspace.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {workspaces.map(ws => (
                <div key={ws.id} style={{
                  background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '22px'
                }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE',
                      padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em'
                    }}>
                      {ws.problem_domain}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#1C1410', background: ws.role === 'leader' ? '#F4A723' : 'rgba(28,20,16,0.06)',
                      padding: '3px 8px', borderRadius: 999, textTransform: 'capitalize'
                    }}>
                      {ws.role}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 4 }}>
                    {ws.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#4A3F38', marginBottom: 16 }}>
                    {ws.problem_title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontSize: 11, color: '#9CA3A0' }}>
                      {ws.last_activity_at
                        ? `Active ${new Date(ws.last_activity_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                        : 'No activity yet'}
                    </div>
                    <Link href={`/teams/${ws.team_id}`} style={{
                      fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723',
                      padding: '8px 14px', borderRadius: 8, textDecoration: 'none'
                    }}>
                      Open Workspace →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {isStudent && (
            <>
              <ActionCard href="/blogs" icon={<BlogIcon />} title="Blogs" desc="Share knowledge, ask doubts, and join the community feed." />
              <ActionCard href="/problems" icon={<SearchIcon />} title="Browse Problems" desc="See all open problems across 8 domains." />
              <ActionCard href="/mentors" icon={<CompassIcon />} title="Find a Mentor" desc="Browse expert mentors for your team." />
              <ActionCard href="/leaderboard" icon={<TrophyIcon />} title="Leaderboard" desc="See where you stand this season." />
              <ActionCard href={`/profile/${profile.profile_slug}`} icon={<ProfileIcon />} title="Your Profile" desc="View your public builder profile." />
            </>
          )}
          {isAdmin && (
            <>
              <ActionCard href="/blogs" icon={<BlogIcon />} title="Blogs" desc="Read and join the shared community feed." />
              <ActionCard href="/admin/problems" icon={<CheckIcon />} title="Approve Problems" desc="Review and approve pending problem posts." />
              <ActionCard href="/admin/judging" icon={<ScaleIcon />} title="Judge Submissions" desc="Score submissions assigned to admin." />
              <ActionCard href="/admin/analytics" icon={<ChartIcon />} title="Analytics" desc="Platform-wide stats and domain breakdown." />
            </>
          )}
        </div>

      </div>
  )
}

function ActionCard({ href, icon, title, desc }: {
  href: string
  icon: ReactNode
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
      <div style={{ marginBottom: 12 }}>{icon}</div>
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

function BlogIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}

function SearchIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}

function CompassIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
}

function TrophyIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F4A723" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
}

function ProfileIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}

function CheckIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}

function ScaleIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20v-4"/><path d="M6 20v-8"/><path d="M2 20h20"/><path d="M2 4l6 4 4-4 4 4 6-4"/></svg>
}

function ChartIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}
