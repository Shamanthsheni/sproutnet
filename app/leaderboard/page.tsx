import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Navbar from '@/app/components/navbar'
import Link from 'next/link'
import RecalculateButton from './recalculate-button'

const AVATAR_COLORS = ['#2D6A4F', '#1E40AF', '#9C6344', '#6B4C2A', '#3D8A65', '#4A3F38', '#7C3AED', '#BE123C']

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function RankBadge({ rank, size = 36 }: { rank: number; size?: number }) {
  const isPodium = rank <= 3
  const colors = ['#F4A723', '#9CA3A0', '#CD7F32']
  const bgs = ['#FEF3C7', '#F3F4F6', '#FFF1E6']

  if (isPodium) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: bgs[rank - 1],
        border: `2.5px solid ${colors[rank - 1]}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: rank === 1 ? 16 : 14, fontWeight: 700,
        color: colors[rank - 1], flexShrink: 0,
        boxShadow: `0 0 0 4px ${bgs[rank - 1]}`
      }}>
        {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#F2EEE8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 13, fontWeight: 600, color: '#6B5E52', flexShrink: 0
    }}>
      {rank}
    </div>
  )
}

function MedalEmoji({ rank }: { rank: number }) {
  return (
    <span style={{ fontSize: 28, lineHeight: 1, display: 'block' }}>
      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
    </span>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  let user: { id: string; name: string; role: string; is_master?: boolean } | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, name, role, is_master')
      .eq('id', authUser.id)
      .single()
    user = profile
  }

  const { data: leaders, error: leaderError } = await admin
    .from('leaderboard')
    .select('*')
    .order('builder_score', { ascending: false })
    .limit(50)

  const ranked = (leaders ?? []).map((l, i) => ({ ...l, liveRank: i + 1 }))
  const podium = ranked.slice(0, 3)
  const table = ranked.slice(3)
  const maxScore = ranked[0]?.builder_score ?? 1

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar user={user} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(28px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 44 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, color: '#2D6A4F',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 8
          }}>
            Season 1 · 2026
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(30px, 6vw, 46px)', fontWeight: 400,
            color: '#1C1410', letterSpacing: '-0.4px',
            marginBottom: 6
          }}>
            The Builders
          </h1>
          <p style={{ fontSize: 14, color: '#6B5E52', fontWeight: 400 }}>
            Builder Score = avg score × depth × problems solved × avg weight
          </p>
        </div>

        {/* Empty */}
        {!leaders || leaders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '72px 24px',
            background: '#fff', borderRadius: 16,
            border: '1.5px solid rgba(28,20,16,0.06)'
          }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 34 34" fill="none">
                <rect width="34" height="34" rx="8" fill="#EAF4EE"/>
                <line x1="17" y1="27" x2="17" y2="15" stroke="#2D6A4F" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
                <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="#2D6A4F"/>
              </svg>
            </div>
            <h2 style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 24, fontWeight: 400, color: '#1C1410',
              margin: '0 0 8px'
            }}>
              Season 1 is just getting started
            </h2>
            <p style={{ fontSize: 14, color: '#6B5E52', marginBottom: 24 }}>
              {leaderError
                ? `Unable to load leaderboard. ${leaderError.message}`
                : 'No submissions scored yet. Be the first builder on the board.'}
            </p>
            {leaderError && user?.role === 'admin' && (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#DC2626', marginBottom: 20 }}>
                Run the migration in Supabase SQL editor to create the leaderboard table.
              </p>
            )}
            <Link href="/problems" style={{
              fontSize: 14, fontWeight: 600,
              color: '#fff', background: '#1C1410',
              padding: '12px 28px', borderRadius: 10,
              textDecoration: 'none', display: 'inline-block'
            }}>
              Browse Problems →
            </Link>
          </div>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'flex-end', gap: 16,
                marginBottom: 40, flexWrap: 'wrap'
              }}>
                {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry, idx) => {
                  const actualRank = [2, 1, 3][idx]
                  const isGold = actualRank === 1
                  const colors = ['#9CA3A0', '#F4A723', '#CD7F32']
                  const bgs = ['#F9FAFB', '#FFFBEB', '#FFF7ED']
                  const accent = colors[actualRank - 1]
                  const bg = bgs[actualRank - 1]
                  const heights = ['170px', '206px', '160px']

                  return (
                    <Link
                      key={entry.id}
                      href={`/profile/${entry.profile_slug}`}
                      style={{ textDecoration: 'none', flex: '1 1 180px', maxWidth: 220, minWidth: 150 }}
                    >
                      <div style={{
                        background: bg,
                        borderRadius: 16,
                        border: `1.5px solid ${isGold ? `${accent}50` : 'rgba(28,20,16,0.06)'}`,
                        padding: isGold ? '28px 16px 24px' : '20px 16px 20px',
                        textAlign: 'center',
                        minHeight: heights[actualRank - 1],
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'box-shadow 0.2s',
                        boxShadow: isGold ? '0 4px 24px rgba(244,167,35,0.1)' : '0 2px 8px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{ marginBottom: 10 }}>
                          <MedalEmoji rank={actualRank} />
                        </div>

                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: avatarColor(entry.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 700,
                          color: '#fff', marginBottom: 10,
                          border: `3px solid ${accent}`,
                          boxShadow: `0 0 0 4px ${bg === '#FFFBEB' ? '#FEF3C7' : bg}`
                        }}>
                          {initials(entry.name)}
                        </div>

                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1410', marginBottom: 2 }}>
                          {entry.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#9CA3A0', marginBottom: 12, lineHeight: 1.3 }}>
                          {entry.dept} · {entry.year}
                        </div>

                        <div style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: isGold ? 32 : 26, fontWeight: 600,
                          color: accent, lineHeight: 1, marginBottom: 2
                        }}>
                          {entry.builder_score}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3A0' }}>pts</div>

                        {entry.badges && entry.badges.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                            {entry.badges.slice(0, 2).map((b: string) => (
                              <span key={b} style={{
                                fontSize: 10, fontWeight: 600, color: '#2D6A4F',
                                background: '#DCFCE7', padding: '3px 10px',
                                borderRadius: 999, lineHeight: 1.2
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

            {/* Table */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .lb-wrap {
                  background: #fff;
                  border: 1.5px solid rgba(28,20,16,0.06);
                  border-radius: 16px;
                  overflow: hidden;
                }
                .lb-row {
                  display: grid;
                  grid-template-columns: 56px 1fr 80px 80px 80px 100px;
                  align-items: center;
                  padding: 14px 20px;
                  border-bottom: 1px solid rgba(28,20,16,0.04);
                  transition: background 0.15s;
                }
                .lb-row:last-child { border-bottom: none; }
                .lb-row:hover { background: #FAF8F4; }
                .lb-hdr {
                  display: grid;
                  grid-template-columns: 56px 1fr 80px 80px 80px 100px;
                  align-items: center;
                  padding: 10px 20px;
                  background: #F4F1EC;
                  border-bottom: 1px solid rgba(28,20,16,0.06);
                }
                .lb-bar {
                  height: 4px;
                  border-radius: 2px;
                  background: #F2EEE8;
                  margin-top: 4px;
                  overflow: hidden;
                }
                .lb-fill {
                  height: 100%;
                  border-radius: 2px;
                  transition: width 0.4s ease;
                }
                @media (max-width: 640px) {
                  .lb-row, .lb-hdr {
                    grid-template-columns: 44px 1fr 80px;
                    padding: 12px 14px;
                  }
                  .lb-hide { display: none; }
                  .lb-bar { display: none; }
                }
              `
            }} />

            {table.length > 0 && (
              <div className="lb-wrap">
                <div className="lb-hdr">
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rank</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Builder</div>
                  <div className="lb-hide" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Solved</div>
                  <div className="lb-hide" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg</div>
                  <div className="lb-hide" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Depth</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Score</div>
                </div>

                {table.map((entry) => {
                  const pct = Number(entry.builder_score) / Number(maxScore) * 100
                  const isPodium = entry.liveRank <= 3
                  return (
                    <Link key={entry.id} href={`/profile/${entry.profile_slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div className="lb-row">
                        <div>
                          <RankBadge rank={entry.liveRank} size={34} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: avatarColor(entry.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0
                          }}>
                            {initials(entry.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3A0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.dept} · {entry.year}
                            </div>
                          </div>
                        </div>

                        <div className="lb-hide" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#4A3F38' }}>
                          {entry.attempted}
                        </div>

                        <div className="lb-hide" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#4A3F38' }}>
                          {Number(entry.avg_score).toFixed(1)}
                        </div>

                        <div className="lb-hide" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#4A3F38' }}>
                          {entry.milestones_done}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 15, fontWeight: 600,
                            color: isPodium ? ['#F4A723', '#9CA3A0', '#CD7F32'][entry.liveRank - 1] : '#4A3F38'
                          }}>
                            {Number(entry.builder_score).toLocaleString()}
                          </div>
                          <div className="lb-bar">
                            <div className="lb-fill" style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: isPodium ? ['#F4A723', '#9CA3A0', '#CD7F32'][entry.liveRank - 1] : '#D4D0C8'
                            }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Footer */}
            <div style={{
              marginTop: 40, padding: '20px 24px',
              background: '#1C1410', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12
            }}>
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, color: 'rgba(250,248,244,0.35)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4
                }}>
                  Season 1 · 2026
                </div>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 18, color: '#FAF8F4'
                }}>
                  Every submission moves your rank.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {user?.role === 'admin' && <RecalculateButton />}
                <Link href="/login/student" style={{
                  fontSize: 14, fontWeight: 600,
                  color: '#1C1410', background: '#F4A723',
                  padding: '11px 24px', borderRadius: 10,
                  textDecoration: 'none', whiteSpace: 'nowrap'
                }}>
                  Start Solving →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
