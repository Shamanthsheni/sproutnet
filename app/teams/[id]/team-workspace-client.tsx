'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RealtimeChat from '@/app/components/realtime-chat'

type Props = {
  team: any
  currentUserId: string
  isLeader: boolean
  isMentor: boolean
  isAdmin: boolean
  members: any[]
  assignedMentors: any[]
  availableMentors: any[]
  workspace: any
  channelId: string | null
  activityLogs: any[]
}

export default function TeamWorkspaceClient({
  team, currentUserId, isLeader, isMentor, isAdmin, members, assignedMentors, availableMentors, workspace, channelId, activityLogs
}: Props) {
  const [copied, setCopied] = useState(false)
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [requestMsg, setRequestMsg] = useState('')
  const [mentorSubmitting, setMentorSubmitting] = useState(false)
  const [mentorError, setMentorError] = useState('')
  const [mentorSuccess, setMentorSuccess] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  function handleCopyInvite() {
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSendMentorRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMentorId) return

    setMentorSubmitting(true)
    setMentorError('')
    setMentorSuccess('')

    const res = await fetch('/api/teams/request-mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: team.id,
        mentorId: selectedMentorId,
        message: requestMsg
      })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setMentorError(data.error || 'Failed to send mentor request.')
      setMentorSubmitting(false)
      return
    }

    setMentorSuccess('Mentorship request sent successfully!')
    setMentorSubmitting(false)
    setTimeout(() => {
      setShowMentorModal(false)
      setMentorSuccess('')
    }, 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Navbar */}
      <nav style={{
        padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        background: 'rgba(250,248,244,0.94)', borderBottom: '1px solid rgba(28,20,16,0.07)'
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1C1410', fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/messages" style={{
            fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723',
            padding: '4px 10px', borderRadius: 8, textDecoration: 'none'
          }}>
            Messages
          </Link>
          <Link href="/notifications" style={{
            fontSize: 13, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE',
            padding: '4px 10px', borderRadius: 8, textDecoration: 'none'
          }}>
            Notifications
          </Link>
          <span style={{ fontSize: 13, color: '#2D6A4F', background: '#EAF4EE', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
            Team Workspace
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 20px' }}>
        
        {/* Header Card */}
        <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 16, padding: '28px', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {team.problems?.domain} · Problem Challenge
              </div>
              <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 34, color: '#1C1410', margin: '4px 0 8px' }}>
                {team.name}
              </h1>
              <p style={{ fontSize: 15, color: '#4A3F38' }}>
                Problem: <strong>{team.problems?.title}</strong>
              </p>
            </div>

            {/* Invite Code Box */}
            <div style={{ background: '#FAF8F4', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 12, padding: '14px 18px', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Team Invite Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#2D6A4F' }}>
                  {team.invite_code}
                </span>
                <button onClick={handleCopyInvite} style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer'
                }}>
                  {copied ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          
          {/* Left Column: Roster, Mentors, Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Members Roster */}
            <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410' }}>
                  Members ({members.length}/{team.problems?.max_team_size || 4})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FAF8F4', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1410' }}>
                        {m.users?.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3A0' }}>{m.users?.email}</div>
                    </div>

                    <span style={{
                      fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '3px 8px', borderRadius: 999,
                      background: m.role === 'leader' ? '#F4A723' : 'rgba(28,20,16,0.08)', color: '#1C1410', fontWeight: 600
                    }}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Mentors */}
            <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410' }}>
                  Assigned Mentors
                </h3>
                {(isLeader || isAdmin) && (
                  <button onClick={() => setShowMentorModal(true)} style={{
                    fontSize: 12, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer'
                  }}>
                    + Request Mentor
                  </button>
                )}
              </div>

              {assignedMentors.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9CA3A0', textAlign: 'center', padding: 12 }}>
                  No mentor assigned yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {assignedMentors.map(a => (
                    <div key={a.mentor_id} style={{ padding: '10px', background: '#FAF8F4', borderRadius: 8, border: '1px solid rgba(45,106,79,0.15)' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#2D6A4F' }}>
                        🛡️ {a.users?.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#4A3F38', marginTop: 2 }}>
                        {a.users?.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '20px' }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#1C1410', marginBottom: 12 }}>
                Workspace Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activityLogs.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#9CA3A0' }}>No recent activity.</div>
                ) : (
                  activityLogs.map(log => (
                    <div key={log.id} style={{ fontSize: 12, color: '#4A3F38', borderBottom: '1px dashed rgba(28,20,16,0.08)', paddingBottom: 6 }}>
                      <div>{log.description}</div>
                      <div style={{ fontSize: 10, color: '#9CA3A0', marginTop: 2 }}>
                        {isMounted ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Embedded Realtime Chat */}
          <div style={{ height: 600 }}>
            {channelId ? (
              <RealtimeChat
                conversationId={channelId}
                currentUserId={currentUserId}
              />
            ) : (
              <div style={{ background: '#fff', padding: 40, textAlign: 'center', borderRadius: 14, color: '#9CA3A0' }}>
                Initializing workspace communication channel...
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Request Mentor Modal */}
      {showMentorModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ width: 'min(480px, 92vw)', background: '#fff', borderRadius: 16, padding: '28px', border: '1.5px solid rgba(28,20,16,0.08)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1410', marginBottom: 8 }}>
              Request Mentor Guidance
            </h2>
            <p style={{ fontSize: 14, color: '#4A3F38', marginBottom: 20 }}>
              Select an available mentor to guide your team through this challenge.
            </p>

            <form onSubmit={handleSendMentorRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mentorError && <div style={{ color: '#DC2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', padding: 10, borderRadius: 8 }}>{mentorError}</div>}
              {mentorSuccess && <div style={{ color: '#16A34A', fontSize: 13, background: 'rgba(34,197,94,0.08)', padding: 10, borderRadius: 8 }}>{mentorSuccess}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1C1410' }}>Available Mentors</label>
                <select
                  value={selectedMentorId}
                  onChange={e => setSelectedMentorId(e.target.value)}
                  required
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, padding: 10, border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8 }}
                >
                  <option value="">-- Choose a mentor --</option>
                  {availableMentors.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.users?.name} ({(m.skills || []).join(', ') || 'General Expert'})
                    </option>
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
                <button type="button" onClick={() => setShowMentorModal(false)} style={{
                  padding: '9px 16px', background: '#fff', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 8, cursor: 'pointer'
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={mentorSubmitting} style={{
                  padding: '9px 18px', background: '#F4A723', border: 'none', borderRadius: 8, fontWeight: 600, color: '#1C1410', cursor: 'pointer'
                }}>
                  {mentorSubmitting ? 'Sending...' : 'Send Request →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
