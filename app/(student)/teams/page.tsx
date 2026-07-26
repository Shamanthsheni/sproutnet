'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TeamProblem = {
  id: string
  title: string
  domain: string
  team_mode: string
  min_team_size: number
  max_team_size: number
  deadline: string
}

type TeamInfo = {
  team_id: string
  team_name: string
  problem_title: string
  role: string
  workspace_id: string
}

export default function TeamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [problems, setProblems] = useState<TeamProblem[]>([])
  const [myTeams, setMyTeams] = useState<TeamInfo[]>([])

  const [teamName, setTeamName] = useState('')
  const [selectedProblem, setSelectedProblem] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdInvite, setCreatedInvite] = useState('')
  const [createError, setCreateError] = useState('')

  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('problems').select('id, title, domain, team_mode, min_team_size, max_team_size, deadline').in('team_mode', ['team', 'both']).eq('status', 'open'),
      supabase.from('team_members').select('team_id, role, teams(id, name, problem_id, problems(title))').not('team_id', 'is', null),
    ]).then(([problemsRes, teamsRes]) => {
      if (problemsRes.data) setProblems(problemsRes.data as TeamProblem[])
      if (teamsRes.data) {
        const list: TeamInfo[] = []
        for (const row of teamsRes.data) {
          const t = row as any
          if (t.teams) {
            list.push({
              team_id: t.team_id,
              team_name: t.teams.name,
              problem_title: t.teams.problems?.title ?? 'Unknown Problem',
              role: t.role,
              workspace_id: '',
            })
          }
        }
        setMyTeams(list)
      }
      setLoading(false)
    })
  }, [])

  async function handleCreate() {
    if (!selectedProblem || !teamName.trim()) return
    setCreating(true)
    setCreateError('')
    setCreatedInvite('')
    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: selectedProblem, teamName: teamName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create team')
      } else {
        setCreatedInvite(data.inviteCode)
        setTeamName('')
        setSelectedProblem('')
        router.refresh()
      }
    } catch {
      setCreateError('Network error. Try again.')
    }
    setCreating(false)
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setJoining(true)
    setJoinError('')
    setJoinSuccess('')
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setJoinError(data.error || 'Failed to join team')
      } else {
        setJoinSuccess(`Joined "${data.teamName}"!`)
        setInviteCode('')
        router.refresh()
      }
    } catch {
      setJoinError('Network error. Try again.')
    }
    setJoining(false)
  }

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 48px)', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {'// collaborate'}
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, color: '#1C1410', margin: 0 }}>
          Teams
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#4A3F38', marginTop: 8 }}>
          Form a team, solve problems together, and build faster.
        </p>
      </div>

      {loading ? (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#9CA3A0' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gap: 48 }}>
          {/* Existing teams */}
          {myTeams.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 16 }}>
                Your Teams
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {myTeams.map(t => (
                  <div key={t.team_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                    <div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410' }}>{t.team_name}</div>
                      <div style={{ fontSize: 13, color: '#4A3F38', marginTop: 4 }}>{t.problem_title} · <span style={{ textTransform: 'capitalize' }}>{t.role}</span></div>
                    </div>
                    <Link href={`/teams/${t.team_id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723', borderRadius: 8, padding: '8px 14px', textDecoration: 'none' }}>
                      Open Workspace →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Team */}
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: 'clamp(20px, 3vw, 32px)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 4 }}>Create a Team</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#4A3F38', marginBottom: 20 }}>Pick a problem and name your team.</p>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#1C1410', display: 'block', marginBottom: 4 }}>Problem</label>
                <select value={selectedProblem} onChange={e => setSelectedProblem(e.target.value)} style={{ width: '100%', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '10px 12px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="">Select a problem...</option>
                  {problems.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.domain}) — {p.team_mode === 'team' ? 'Team only' : 'Solo or Team'} · up to {p.max_team_size} members
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#1C1410', display: 'block', marginBottom: 4 }}>Team Name</label>
                <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. The Debuggers" style={{ width: '100%', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <button onClick={handleCreate} disabled={creating || !selectedProblem || !teamName.trim()} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#1C1410', background: creating ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 8, padding: '12px', cursor: creating ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Creating...' : 'Create Team →'}
              </button>

              {createdInvite && (
                <div style={{ background: 'rgba(45,106,79,0.12)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Invite Code</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#F4A723', letterSpacing: '0.12em' }}>{createdInvite}</div>
                  <button onClick={() => navigator.clipboard.writeText(createdInvite)} style={{ marginTop: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
                    Copy Code
                  </button>
                </div>
              )}

              {createError && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#DC2626' }}>{createError}</div>}
            </div>
          </div>

          {/* Join Team */}
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: 'clamp(20px, 3vw, 32px)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 4 }}>Join a Team</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#4A3F38', marginBottom: 20 }}>Enter the invite code shared by your team leader.</p>

            <div style={{ display: 'grid', gap: 14 }}>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="e.g. SPROUT-XXXXXX" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '10px 12px', outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box' }} />

              <button onClick={handleJoin} disabled={joining || !inviteCode.trim()} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#1C1410', background: joining ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 8, padding: '12px', cursor: joining ? 'not-allowed' : 'pointer' }}>
                {joining ? 'Joining...' : 'Join Team →'}
              </button>

              {joinSuccess && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#2D6A4F' }}>{joinSuccess}</div>}
              {joinError && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#DC2626' }}>{joinError}</div>}
            </div>
          </div>

          {/* Browse problems */}
          {problems.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410', marginBottom: 16 }}>
                Problems You Can Team Up On
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {problems.map(p => {
                  const inTeam = myTeams.some(t => t.team_name && p.title === t.problem_title)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                      <div>
                        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410' }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: '#4A3F38', marginTop: 4 }}>
                          {p.domain} · {p.team_mode === 'team' ? 'Team only' : 'Solo or Team'} · {p.min_team_size}–{p.max_team_size} members
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {inTeam ? (
                          <span style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600 }}>Already in a team</span>
                        ) : (
                          <Link href={`/problems/${p.id}`} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#2D6A4F', textDecoration: 'none' }}>
                            View Problem →
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {problems.length === 0 && myTeams.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3A0', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
              No team-enabled problems are available right now. Check back later or{' '}
              <Link href="/problems" style={{ color: '#2D6A4F', fontWeight: 600 }}>browse all problems</Link>.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
