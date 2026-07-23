import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Navbar, { type NavbarUser } from '@/app/components/navbar'

type ProfileRow = {
  id: string
  name: string
  dept: string | null
  year: string | null
  role: string
  profile_slug: string | null
  builder_score: number | null
  attempted: number | null
  avg_score: number | null
  milestones_done: number | null
}

type LeaderboardRow = {
  rank: number | null
  builder_score: number | null
  badges: string[] | null
}

type SubmissionRow = {
  id: string
  stage: string
  milestone: number
  status: string
  created_at: string
  problems?: { title: string | null; domain: string | null } | null
}

const AVATAR_COLORS = [
  '#2D6A4F', '#1C1410', '#F4A723', '#1E40AF',
  '#6B4C2A', '#9C6344', '#3D8A65', '#4A3F38',
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const [{ data: auth }, { data: profile }, { data: leaderboardRows }] = await Promise.all([
    supabase.auth.getUser(),
    admin
      .from('users')
      .select('id, name, dept, year, role, profile_slug, builder_score, attempted, avg_score, milestones_done')
      .eq('profile_slug', slug)
      .single(),
    admin
      .from('leaderboard')
      .select('rank, builder_score, badges')
      .eq('profile_slug', slug)
      .limit(1),
  ])

  if (!profile || profile.role !== 'student') {
    notFound()
  }

  const leaderboard = ((leaderboardRows ?? [])[0] ?? null) as LeaderboardRow | null
  const userProfile = profile as ProfileRow
  const isOwnProfile = auth.user?.id === userProfile.id

  let currentUser: NavbarUser | null = null
  if (auth?.user) {
    const { data: curProfile } = await supabase
      .from('users')
      .select('id, name, role, is_master')
      .eq('id', auth.user.id)
      .single()
    if (curProfile) currentUser = curProfile as NavbarUser
  }

  const { data: submissionRows } = await admin
    .from('submissions')
    .select('id, stage, milestone, status, created_at, problems(title, domain)')
    .eq('student_id', userProfile.id)
    .order('created_at', { ascending: false })
    .limit(12)

  const submissions = (submissionRows ?? []) as unknown as SubmissionRow[]

  const domainCounts = new Map<string, number>()
  for (const submission of submissions) {
    const domain = submission.problems?.domain
    if (!domain) continue
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1)
  }

  const topDomains = Array.from(domainCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  const badges = leaderboard?.badges ?? []
  const builderScore = leaderboard?.builder_score ?? profile.builder_score ?? 0

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar user={currentUser} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(28px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.9fr)',
          gap: 24,
          alignItems: 'stretch',
          marginBottom: 28,
        }}>
          <section style={{
            background: 'linear-gradient(135deg, #1C1410 0%, #2D1D15 50%, #3E2B1F 100%)',
            borderRadius: 24,
            padding: 'clamp(24px, 5vw, 36px)',
            color: '#FAF8F4',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              inset: 'auto -80px -90px auto',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(244,167,35,0.32) 0%, rgba(244,167,35,0) 70%)',
            }} />

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: 'rgba(250,248,244,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 18,
            }}>
              {isOwnProfile ? '// your builder profile' : '// public builder profile'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
              <div style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: avatarColor(userProfile.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Sora, sans-serif',
                fontSize: 24,
                fontWeight: 700,
                color: '#fff',
                boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
              }}>
                {initials(userProfile.name)}
              </div>

              <div>
                <h1 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 'clamp(30px, 7vw, 48px)',
                  fontWeight: 400,
                  lineHeight: 1.05,
                  marginBottom: 8,
                  letterSpacing: '-0.5px',
                }}>
                  {userProfile.name}
                </h1>
                <div style={{ fontSize: 15, color: 'rgba(250,248,244,0.72)' }}>
                  {[userProfile.dept, userProfile.year].filter(Boolean).join(' · ') || 'Student Builder'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#1C1410',
                background: '#F4A723',
                borderRadius: 999,
                padding: '6px 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Builder Score {builderScore}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#D6F4E0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                padding: '6px 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {leaderboard?.rank ? `Rank #${leaderboard.rank}` : 'Unranked'}
              </span>
            </div>

            <p style={{
              maxWidth: 620,
              fontSize: 15,
              lineHeight: 1.7,
              color: 'rgba(250,248,244,0.78)',
              marginBottom: 26,
            }}>
              {isOwnProfile
                ? 'This is your public builder page. It is what other people will see from the leaderboard and your dashboard.'
                : 'A public snapshot of this builder’s progress across real-world problems, milestones, and judged work on SproutNet.'}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {isOwnProfile ? (
                <>
                  <Link href="/problems" style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1C1410',
                    background: '#F4A723',
                    padding: '12px 20px',
                    borderRadius: 10,
                    textDecoration: 'none',
                  }}>
                    Browse Problems →
                  </Link>
                  <Link href="/dashboard" style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#FAF8F4',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '12px 20px',
                    borderRadius: 10,
                    textDecoration: 'none',
                  }}>
                    Back to Dashboard
                  </Link>
                </>
              ) : (
                <Link href="/leaderboard" style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1C1410',
                  background: '#F4A723',
                  padding: '12px 20px',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}>
                  Back to Leaderboard →
                </Link>
              )}
            </div>
          </section>

          <aside style={{
            background: '#fff',
            border: '1.5px solid rgba(28,20,16,0.07)',
            borderRadius: 24,
            padding: 'clamp(20px, 4vw, 28px)',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#9CA3A0',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 18,
            }}>
              {'// snapshot'}
            </div>

            {[
              { label: 'Builder Score', value: builderScore, accent: '#F4A723' },
              { label: 'Problems Attempted', value: userProfile.attempted ?? 0, accent: '#2D6A4F' },
              { label: 'Average Score', value: userProfile.avg_score ? Number(userProfile.avg_score).toFixed(1) : '—', accent: '#1C1410' },
              { label: 'Solutions Completed', value: userProfile.milestones_done ?? 0, accent: '#2D6A4F' },
            ].map((item, index) => (
              <div key={item.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: index < 3 ? '1px solid rgba(28,20,16,0.07)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#7A7068' }}>{item.label}</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 16,
                  fontWeight: 600,
                  color: item.accent,
                }}>
                  {item.value}
                </span>
              </div>
            ))}

            <div style={{
              marginTop: 20,
              padding: '16px 16px 6px',
              background: '#F6F2EB',
              borderRadius: 16,
            }}>
              <div style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#1C1410',
                marginBottom: 12,
              }}>
                Badges
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {badges.length > 0 ? badges.map(badge => (
                  <span key={badge} style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: '#2D6A4F',
                    background: '#EAF4EE',
                    borderRadius: 999,
                    padding: '6px 10px',
                  }}>
                    {badge}
                  </span>
                )) : (
                  <span style={{ fontSize: 13, color: '#7A7068', paddingBottom: 10 }}>
                    No badges yet. Keep solving and submitting.
                  </span>
                )}
              </div>
            </div>
          </aside>

          <aside style={{ display: 'grid', gap: 20 }}>
            <section style={{
              background: '#EAF4EE',
              border: '1px solid rgba(45,106,79,0.14)',
              borderRadius: 24,
              padding: '22px 22px',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#2D6A4F',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 12,
              }}>
                {'// domain focus'}
              </div>

              <h3 style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 17,
                fontWeight: 700,
                color: '#1C1410',
                marginBottom: 14,
              }}>
                Problem domains
              </h3>

              {topDomains.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {topDomains.map(([domain, count]) => (
                    <div key={domain} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 12,
                      borderBottom: '1px solid rgba(45,106,79,0.1)',
                    }}>
                      <span style={{ fontSize: 14, color: '#2D6A4F', fontWeight: 500 }}>{domain}</span>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: '#1C1410',
                      }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#5C6D63', lineHeight: 1.6 }}>
                  Domain strengths will appear here once submissions start coming in.
                </div>
              )}
            </section>

            <section style={{
              background: '#fff',
              border: '1.5px solid rgba(28,20,16,0.07)',
              borderRadius: 24,
              padding: '22px 22px',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#9CA3A0',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 12,
              }}>
                {'// public profile link'}
              </div>

              <div style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#1C1410',
                marginBottom: 8,
              }}>
                Share this page
              </div>

              <p style={{ fontSize: 13, color: '#7A7068', lineHeight: 1.6, marginBottom: 14 }}>
                This URL is the profile destination used by the leaderboard and dashboard.
              </p>

              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: '#2D6A4F',
                background: '#F6F2EB',
                borderRadius: 14,
                padding: '12px 14px',
                overflowX: 'auto',
              }}>
                /profile/{userProfile.profile_slug}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
