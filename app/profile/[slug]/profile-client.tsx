'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditProfile } from './edit-profile'
import type { ProfileUser, LeaderboardNeighbor, RecentSubmission, EnrollmentProgress } from './page'

export function ProfileClient({
  profile, isOwnProfile, neighbors, myRank, submissions, enrollments, avatarColor, initials,
}: {
  profile: ProfileUser
  isOwnProfile: boolean
  neighbors: LeaderboardNeighbor[]
  myRank: number | null
  submissions: RecentSubmission[]
  enrollments: EnrollmentProgress[]
  avatarColor: string
  initials: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const stats = [
    { label: 'Builder Score', value: profile.builder_score ?? 0, color: '#F4A723' },
    { label: 'Attempted', value: profile.attempted ?? 0, color: '#2D6A4F' },
    { label: 'Avg Score', value: profile.avg_score ? Number(profile.avg_score).toFixed(1) : '—', color: '#1C1410' },
    { label: 'Milestones', value: profile.milestones_done ?? 0, color: '#2D6A4F' },
  ]

  const badges: string[] = []
  if (profile.milestones_done && profile.milestones_done >= 5) badges.push('Deep Thinker')
  if (profile.avg_score && profile.avg_score >= 8) badges.push('Expert Solver')
  if (profile.attempted && profile.attempted >= 3) badges.push('Multi-Problem')

  async function handleAvatarUpload(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('avatar', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
    if (res.ok) router.refresh()
    setUploading(false)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleAvatarUpload(file)
  }

  const socialLinks: { label: string; url: string; icon: string }[] = []
  if (profile.github) socialLinks.push({ label: 'GitHub', url: profile.github, icon: '⌨' })
  if (profile.linkedin) socialLinks.push({ label: 'LinkedIn', url: profile.linkedin, icon: '🔗' })
  if (profile.twitter) socialLinks.push({ label: 'Twitter', url: profile.twitter, icon: '𝕏' })

  const section = (content: React.ReactNode | null) => content ? (
    <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 20 }}>
      {content}
    </div>
  ) : null

  return (
    <>
      <style>{`
        .p-row {
          display: flex; gap: 24px; align-items: flex-start;
          max-width: 1200px; margin: 0 auto;
          padding: clamp(24px, 5vw, 44px) clamp(20px, 5vw, 40px) clamp(60px, 8vw, 100px);
        }
        .p-col {
          display: flex; flex-direction: column; gap: 18px; flex: 1; min-width: 0;
        }
        .p-col-narrow { flex: 0 0 260px; }
        @media (max-width: 800px) {
          .p-row { flex-direction: column; }
          .p-col-narrow { flex: none; width: 100%; }
        }
      `}</style>

      <div className="p-row">
        {/* Narrow column: avatar + stats */}
        <div className="p-col p-col-narrow">
          {/* Avatar + Identity */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: '#fff' }}>
                  {initials}
                </div>
              )}
              {isOwnProfile && (
                <>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFileChange} style={{ display: 'none' }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                    position: 'absolute', bottom: 0, right: -4, width: 32, height: 32, borderRadius: '50%',
                    border: '2.5px solid #fff', background: '#F4A723', color: '#1C1410', fontSize: 13,
                    cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {uploading ? '…' : '✎'}
                  </button>
                </>
              )}
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1C1410', margin: 0 }}>{profile.name}</h1>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE', padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{profile.role}</span>
              <span style={{ fontSize: 13, color: '#6B5E52' }}>{[profile.dept, profile.year].filter(Boolean).join(' · ')}</span>
            </div>
            {isOwnProfile && (
              <button onClick={() => setEditing(true)} style={{
                marginTop: 12, padding: '8px 18px', borderRadius: 8,
                border: '1.5px solid rgba(28,20,16,0.1)', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#4A3F38', cursor: 'pointer', width: '100%',
              }}>
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 600, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#9CA3A0', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wide column: everything else */}
        <div className="p-col">
          {/* Leaderboard */}
          {myRank && section(
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Leaderboard Rank
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600, color: '#F4A723' }}>#{myRank}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {neighbors.map(n => (
                  <Link key={n.profile_slug} href={`/profile/${n.profile_slug}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                    padding: '6px 12px', borderRadius: 8, fontSize: 13,
                    background: n.profile_slug === profile.profile_slug ? '#FEF3C7' : '#F6F2EB',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9CA3A0' }}>#{n.rank}</span>
                    <span style={{ color: n.profile_slug === profile.profile_slug ? '#1C1410' : '#4A3F38', fontWeight: n.profile_slug === profile.profile_slug ? 600 : 400 }}>
                      {n.profile_slug === profile.profile_slug ? 'You' : n.name}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9CA3A0' }}>{n.builder_score}</span>
                  </Link>
                ))}
              </div>
              <Link href="/leaderboard" style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 12, color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
                Full Leaderboard →
              </Link>
            </>
          )}

          {/* Bio */}
          {profile.bio && section(
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>About</div>
              <p style={{ fontSize: 14, color: '#4A3F38', lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
            </>
          )}

          {/* Social + Badges row */}
          {(socialLinks.length > 0 || badges.length > 0) && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {socialLinks.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Connect</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {socialLinks.map(s => (
                      <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#4A3F38', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15 }}>{s.icon}</span> {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {badges.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Badges</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {badges.map(b => (
                      <span key={b} style={{ fontSize: 11, fontWeight: 600, color: '#2D6A4F', background: '#DCFCE7', padding: '4px 10px', borderRadius: 999 }}>{b}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Recent Activity
            </div>
            {submissions.length > 0 ? (
              <div>
                {submissions.map((sub, i) => (
                  <div key={sub.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: i < submissions.length - 1 ? '1px solid rgba(28,20,16,0.04)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1410' }}>{sub.problem_title ?? 'Submission'}</div>
                      <div style={{ fontSize: 12, color: '#9CA3A0', marginTop: 2 }}>
                        {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      {sub.score != null ? (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 600, color: sub.score >= 7 ? '#2D6A4F' : sub.score >= 4 ? '#F4A723' : '#DC2626' }}>
                          {sub.score}/10
                        </span>
                      ) : (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#9CA3A0' }}>Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Active Enrollments */}
          {enrollments.length > 0 && section(
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>In Progress</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {enrollments.map(e => {
                  const pct = Math.min(100, Math.round((e.milestone / e.total_milestones) * 100))
                  return (
                    <div key={e.problem_id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#1C1410' }}>{e.problem_title ?? 'Problem'}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6B5E52' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: '#F2EEE8', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: pct === 100 ? '#2D6A4F' : '#F4A723', width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {editing && (
        <EditProfile
          data={{
            name: profile.name,
            dept: profile.dept ?? '',
            year: profile.year ?? '',
            bio: profile.bio ?? '',
            github: profile.github ?? '',
            linkedin: profile.linkedin ?? '',
            twitter: profile.twitter ?? '',
            profile_slug: profile.profile_slug ?? '',
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
