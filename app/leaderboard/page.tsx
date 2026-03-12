import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: leaders } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(50)

  const top3 = leaders?.slice(0, 3) ?? []
  const rest = leaders?.slice(3) ?? []

  const AVATAR_COLORS = [
    '#2D6A4F', '#1C1410', '#F4A723', '#1E40AF',
    '#6B4C2A', '#9C6344', '#3D8A65', '#4A3F38'
  ]

  function avatarColor(name: string) {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  }

  function initials(name: string) {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        height: 66, padding: '0 52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/problems" style={{ fontSize: 14, color: '#4A3F38', textDecoration: 'none' }}>Problems</Link>
          <Link href="/leaderboard" style={{ fontSize: 14, fontWeight: 500, color: '#1C1410', textDecoration: 'none' }}>Leaderboard</Link>
          <Link href="/dashboard" style={{
            fontSize: 14, fontWeight: 600, color: '#1C1410',
            background: '#F4A723', padding: '8px 20px',
            borderRadius: 6, textDecoration: 'none'
          }}>Dashboard →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#2D6A4F',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 12
          }}>
            // season 1 · 2026
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 52, fontWeight: 400,
            color: '#1C1410', letterSpacing: '-0.5px',
            marginBottom: 12
          }}>
            The Builders.
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300 }}>
            Builder Score = avg score × depth × milestones completed.
          </p>
        </div>

        {/* Empty state */}
        {(!leaders || leaders.length === 0) && (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: 14,
            border: '1.5px solid rgba(28,20,16,0.07)'
          }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <svg width="56" height="56" viewBox="0 0 34 34" fill="none">
                <rect width="34" height="34" rx="8" fill="#EAF4EE"/>
                <line x1="17" y1="27" x2="17" y2="15" stroke="#2D6A4F" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
                <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="#2D6A4F"/>
              </svg>
            </div>
            <div style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 28, color: '#1C1410', marginBottom: 8
            }}>
              Season 1 is just getting started.
            </div>
            <p style={{ fontSize: 15, color: '#4A3F38', fontWeight: 300, marginBottom: 28 }}>
              No scored submissions yet. Be the first builder on the board.
            </p>
            <Link href="/problems" style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15, fontWeight: 600,
              color: '#1C1410', background: '#F4A723',
              padding: '13px 32px', borderRadius: 8,
              textDecoration: 'none'
            }}>
              Browse Problems →
            </Link>
          </div>
        )}

        {/* Podium — top 3 */}
        {top3.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', gap: 16, marginBottom: 40
          }}>
            {/* Reorder: 2nd, 1st, 3rd */}
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((leader, idx) => {
              const isFirst = leader.rank === 1
              const podiumRank = [2, 1, 3][idx]
              return (
                <Link key={leader.id} href={`/profile/${leader.profile_slug}`} style={{ textDecoration: 'none', flex: 1, maxWidth: 220 }}>
                  <div style={{
                    background: isFirst
                      ? 'linear-gradient(to bottom, rgba(244,167,35,0.06), #fff)'
                      : '#fff',
                    border: `1.5px solid ${isFirst ? 'rgba(244,167,35,0.3)' : 'rgba(28,20,16,0.07)'}`,
                    borderRadius: 14,
                    padding: isFirst ? '34px 20px' : '24px 20px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    {isFirst && (
                      <div style={{
                        position: 'absolute', top: -16, left: '50%',
                        transform: 'translateX(-50%)', fontSize: 24
                      }}>👑</div>
                    )}
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11, color: isFirst ? '#F4A723' : '#9CA3A0',
                      marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em'
                    }}>
                      #{podiumRank}
                    </div>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: avatarColor(leader.name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700,
                      color: '#fff', margin: '0 auto 12px'
                    }}>
                      {initials(leader.name)}
                    </div>
                    <div style={{
                      fontFamily: 'Sora, sans-serif', fontSize: 14,
                      fontWeight: 600, color: '#1C1410', marginBottom: 4
                    }}>
                      {leader.name}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                      color: '#9CA3A0', marginBottom: 12
                    }}>
                      {leader.dept} · {leader.year}
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 28, fontWeight: 500, color: '#F4A723'
                    }}>
                      {leader.builder_score}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3A0', marginTop: 4 }}>
                      Builder Score
                    </div>
                    {leader.badges && leader.badges.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                        {leader.badges.slice(0, 3).map((b: string) => (
                          <span key={b} style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 10, color: '#2D6A4F',
                            background: '#EAF4EE', padding: '2px 8px',
                            borderRadius: 999
                          }}>
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Full table */}
        {rest.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1.5px solid rgba(28,20,16,0.07)',
            borderRadius: 14, overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr 80px 80px 80px 100px',
              padding: '12px 24px',
              background: '#F2EEE8',
              borderBottom: '1px solid rgba(28,20,16,0.06)'
            }}>
              {['#', 'Builder', 'Tried', 'Avg', 'Miles', 'Score'].map(h => (
                <div key={h} style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, color: '#9CA3A0',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {rest.map((leader) => (
              <Link key={leader.id} href={`/profile/${leader.profile_slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr 80px 80px 80px 100px',
                  padding: '14px 24px',
                  borderBottom: '1px solid rgba(28,20,16,0.04)',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13, color: '#9CA3A0'
                  }}>
                    {leader.rank}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: avatarColor(leader.name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Sora, sans-serif', fontSize: 10,
                      fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>
                      {initials(leader.name)}
                    </div>
                    <div>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 13, fontWeight: 500, color: '#1C1410'
                      }}>
                        {leader.name}
                      </div>
                      <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 11, color: '#9CA3A0'
                      }}>
                        {leader.dept} · {leader.year}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12, color: '#4A3F38'
                  }}>
                    {leader.attempted}
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12, color: '#4A3F38'
                  }}>
                    {Number(leader.avg_score).toFixed(1)}
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12, color: '#4A3F38'
                  }}>
                    {leader.milestones_done}
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 16, fontWeight: 500, color: '#F4A723'
                  }}>
                    {leader.builder_score}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Season info */}
        <div style={{
          marginTop: 40, padding: '24px 28px',
          background: '#1C1410', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, color: 'rgba(250,248,244,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6
            }}>
              Season 1 · 2026
            </div>
            <div style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 20, color: '#FAF8F4'
            }}>
              Every submission moves your rank.
            </div>
          </div>
          <Link href="/login/student" style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14, fontWeight: 600,
            color: '#1C1410', background: '#F4A723',
            padding: '12px 24px', borderRadius: 8,
            textDecoration: 'none', whiteSpace: 'nowrap'
          }}>
            Start Solving →
          </Link>
        </div>

      </div>
    </div>
  )
}
