'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type MentorProfile = {
  user_id: string
  bio: string | null
  skills: string[]
  technologies: string[]
  experience_years: number
  linkedin_url: string | null
  github_url: string | null
  availability_status: string
  max_active_teams: number
  users: { id: string; name: string; email: string } | null
}

type Props = {
  mentors: MentorProfile[]
  currentUser: { id: string; name: string; role: string } | null
  userTeams: Array<{ id: string; name: string }>
  pendingMentorIds: string[]
}

export default function MentorsClient({ mentors, currentUser, userTeams, pendingMentorIds }: Props) {
  const [search, setSearch] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [filterTech, setFilterTech] = useState('')
  const [showAvailable, setShowAvailable] = useState(false)

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [requestMsg, setRequestMsg] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState('')

  // Individual connect modal state
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [connectMentorId, setConnectMentorId] = useState('')
  const [connectMsg, setConnectMsg] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [connectSuccess, setConnectSuccess] = useState('')

  const allSkills = useMemo(() => {
    const set = new Set<string>()
    mentors.forEach(m => m.skills?.forEach(s => set.add(s)))
    return Array.from(set).sort()
  }, [mentors])

  const allTechnologies = useMemo(() => {
    const set = new Set<string>()
    mentors.forEach(m => m.technologies?.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [mentors])

  const filtered = useMemo(() => {
    let list = mentors
    if (showAvailable) list = list.filter(m => m.availability_status === 'available')
    if (filterSkill) list = list.filter(m => m.skills?.includes(filterSkill))
    if (filterTech) list = list.filter(m => m.technologies?.includes(filterTech))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        m.users?.name?.toLowerCase().includes(q) ||
        m.bio?.toLowerCase().includes(q) ||
        m.skills?.some(s => s.toLowerCase().includes(q)) ||
        m.technologies?.some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [mentors, search, filterSkill, filterTech, showAvailable])

  function openRequestModal(mentorId: string) {
    if (!currentUser) return
    setSelectedMentorId(mentorId)
    setSelectedTeamId(userTeams[0]?.id || '')
    setRequestMsg('')
    setRequestError('')
    setRequestSuccess('')
    setShowRequestModal(true)
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMentorId || !selectedTeamId) return

    setRequesting(true)
    setRequestError('')
    setRequestSuccess('')

    const res = await fetch('/api/teams/request-mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: selectedTeamId,
        mentorId: selectedMentorId,
        message: requestMsg
      })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setRequestError(data.error || 'Failed to send request.')
      setRequesting(false)
      return
    }

    setRequestSuccess('Request sent! The mentor will be notified.')
    setRequesting(false)
    setTimeout(() => setShowRequestModal(false), 1800)
  }

  function openConnectModal(mentorId: string) {
    if (!currentUser) return
    setConnectMentorId(mentorId)
    setConnectMsg('')
    setConnectError('')
    setConnectSuccess('')
    setShowConnectModal(true)
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!connectMentorId) return

    setConnecting(true)
    setConnectError('')
    setConnectSuccess('')

    const res = await fetch('/api/mentors/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: connectMentorId, message: connectMsg })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setConnectError(data.error || 'Failed to send connection request.')
      setConnecting(false)
      return
    }

    setConnectSuccess('Connection request sent! The mentor will be notified.')
    setConnecting(false)
    setTimeout(() => setShowConnectModal(false), 1800)
  }

  if (!mentors || mentors.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧭</div>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 34, color: '#1C1410', fontWeight: 400, marginBottom: 12 }}>
          No mentors registered yet
        </h1>
        <p style={{ fontSize: 15, color: '#4A3F38', maxWidth: 480, margin: '0 auto' }}>
          Mentors will appear here once they set up their profiles. Check back later.
        </p>
        <Link href="/dashboard" style={{ display: 'inline-block', marginTop: 20, fontSize: 14, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '12px 24px', borderRadius: 8, textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {'// find your guide'}
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(30px, 5vw, 40px)', fontWeight: 400, color: '#1C1410', marginBottom: 8 }}>
          Browse Mentors
        </h1>
        <p style={{ fontSize: 15, color: '#4A3F38', maxWidth: 600 }}>
          Connect with expert mentors who can guide your team through the challenge. Filter by skills and technologies to find the right match.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search mentors by name, skills, or bio..."
          style={{
            flex: '1 1 260px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410',
            background: '#fff', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 10,
            padding: '10px 14px', outline: 'none', minWidth: 0
          }}
        />
        <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, padding: '10px 12px', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 10, background: '#fff', color: '#1C1410' }}>
          <option value="">All Skills</option>
          {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTech} onChange={e => setFilterTech(e.target.value)} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, padding: '10px 12px', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 10, background: '#fff', color: '#1C1410' }}>
          <option value="">All Technologies</option>
          {allTechnologies.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4A3F38', cursor: 'pointer' }}>
          <input type="checkbox" checked={showAvailable} onChange={e => setShowAvailable(e.target.checked)} style={{ accentColor: '#2D6A4F' }} />
          Available only
        </label>
      </div>

      {/* Results count */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9CA3A0', marginBottom: 20 }}>
        {filtered.length} mentor{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Mentor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {filtered.map(m => (
          <div key={m.user_id} style={{
            background: '#fff', border: `1.5px solid ${m.availability_status === 'available' ? 'rgba(45,106,79,0.15)' : 'rgba(28,20,16,0.07)'}`,
            borderRadius: 14, padding: '24px', display: 'flex', flexDirection: 'column'
          }}>
            {/* Mentor Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1410' }}>
                  {m.users?.name || 'Unknown'}
                </div>
                <div style={{ fontSize: 13, color: '#4A3F38', marginTop: 2 }}>
                  {m.experience_years > 0 ? `${m.experience_years} year${m.experience_years > 1 ? 's' : ''} experience` : 'New mentor'}
                </div>
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '3px 8px', borderRadius: 999,
                background: m.availability_status === 'available' ? 'rgba(34,197,94,0.1)' : m.availability_status === 'busy' ? 'rgba(244,167,35,0.1)' : 'rgba(28,20,16,0.06)',
                color: m.availability_status === 'available' ? '#16A34A' : m.availability_status === 'busy' ? '#D97706' : '#9CA3A0',
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>
                {m.availability_status}
              </span>
            </div>

            {/* Bio */}
            {m.bio && (
              <div style={{ fontSize: 13, color: '#4A3F38', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m.bio}
              </div>
            )}

            {/* Skills */}
            {m.skills && m.skills.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                  Skills
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {m.skills.map(s => (
                    <span key={s} style={{
                      fontSize: 11, fontWeight: 500, color: '#2D6A4F', background: '#EAF4EE',
                      padding: '2px 8px', borderRadius: 999
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {m.technologies && m.technologies.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                  Technologies
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {m.technologies.map(t => (
                    <span key={t} style={{
                      fontSize: 11, fontWeight: 500, color: '#1C1410', background: 'rgba(28,20,16,0.06)',
                      padding: '2px 8px', borderRadius: 999
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links & Action */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {m.linkedin_url && (
                <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
              )}
              {m.github_url && (
                <a href={m.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1C1410', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  GitHub
                </a>
              )}
              <div style={{ flex: 1 }} />
              {currentUser?.role === 'student' ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {pendingMentorIds.includes(m.user_id) ? (
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                      color: '#D97706', background: 'rgba(244,167,35,0.1)', border: '1px solid rgba(244,167,35,0.2)', borderRadius: 8,
                      padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Pending
                    </span>
                  ) : (
                    <button onClick={() => openConnectModal(m.user_id)} style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                      color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8,
                      padding: '8px 14px', cursor: 'pointer'
                    }}>
                      Connect
                    </button>
                  )}
                  {userTeams.length > 0 && (
                    <button onClick={() => openRequestModal(m.user_id)} style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                      color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 8,
                      padding: '8px 14px', cursor: 'pointer'
                    }}>
                      Request for Team
                    </button>
                  )}
                </div>
              ) : currentUser && currentUser.role === 'mentor' ? (
                <span style={{ fontSize: 11, color: '#9CA3A0' }}>
                  You are a mentor
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3A0' }}>
          No mentors match your current filters. Try adjusting your search criteria.
        </div>
      )}

      {/* Request Mentor Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ width: 'min(480px, 92vw)', background: '#fff', borderRadius: 16, padding: '28px', border: '1.5px solid rgba(28,20,16,0.08)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410', marginBottom: 8 }}>
              Request Mentor Guidance
            </h2>
            <p style={{ fontSize: 14, color: '#4A3F38', marginBottom: 20 }}>
              Choose a team to request mentorship from this expert.
            </p>

            <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {requestError && <div style={{ color: '#DC2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', padding: 10, borderRadius: 8 }}>{requestError}</div>}
              {requestSuccess && <div style={{ color: '#16A34A', fontSize: 13, background: 'rgba(34,197,94,0.08)', padding: 10, borderRadius: 8 }}>{requestSuccess}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1C1410' }}>Select Team</label>
                <select
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  required
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, padding: 10, border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8 }}
                >
                  <option value="">-- Choose a team --</option>
                  {userTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1C1410' }}>Request Message (optional)</label>
                <textarea
                  value={requestMsg}
                  onChange={e => setRequestMsg(e.target.value)}
                  rows={3}
                  placeholder="Introduce your team and explain what guidance you need..."
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, padding: 10, border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowRequestModal(false)} style={{
                  padding: '9px 16px', background: '#fff', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 8, cursor: 'pointer'
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={requesting} style={{
                  padding: '9px 18px', background: '#F4A723', border: 'none', borderRadius: 8, fontWeight: 600, color: '#1C1410', cursor: 'pointer'
                }}>
                  {requesting ? 'Sending...' : 'Send Request →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Connect Modal */}
      {showConnectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ width: 'min(480px, 92vw)', background: '#fff', borderRadius: 16, padding: '28px', border: '1.5px solid rgba(28,20,16,0.08)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410', marginBottom: 8 }}>
              Connect with Mentor
            </h2>
            <p style={{ fontSize: 14, color: '#4A3F38', marginBottom: 20 }}>
              Send a personal mentorship request directly. The mentor will be notified and can start a conversation with you.
            </p>

            <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {connectError && <div style={{ color: '#DC2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', padding: 10, borderRadius: 8 }}>{connectError}</div>}
              {connectSuccess && <div style={{ color: '#16A34A', fontSize: 13, background: 'rgba(34,197,94,0.08)', padding: 10, borderRadius: 8 }}>{connectSuccess}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1C1410' }}>Message (optional)</label>
                <textarea
                  value={connectMsg}
                  onChange={e => setConnectMsg(e.target.value)}
                  rows={3}
                  placeholder="Introduce yourself and explain what you'd like guidance on..."
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, padding: 10, border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowConnectModal(false)} style={{
                  padding: '9px 16px', background: '#fff', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 8, cursor: 'pointer'
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={connecting} style={{
                  padding: '9px 18px', background: '#8B5CF6', border: 'none', borderRadius: 8, fontWeight: 600, color: '#fff', cursor: 'pointer'
                }}>
                  {connecting ? 'Sending...' : 'Send Request →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
