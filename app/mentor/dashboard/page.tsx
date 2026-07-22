import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ConnectRequestCard from './connect-request-card'

export default async function MentorDashboardPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/mentor')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login/mentor')
  if (profile.role !== 'mentor' && profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch mentor profile details
  const { data: mentorProfile } = await admin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch assigned teams
  const { data: assignments } = await admin
    .from('mentor_assignments')
    .select('team_id, assigned_at, teams(id, name, status, problem_id, problems(id, title, domain))')
    .eq('mentor_id', user.id)

  // Fetch pending team mentor requests
  const { data: pendingRequests } = await admin
    .from('mentor_requests')
    .select('id, team_id, message, created_at, requested_by, users(name, email), teams(id, name, problems(title, domain))')
    .eq('mentor_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Fetch individual connection requests (from notifications)
  const { data: connectReqs } = await admin
    .from('notifications')
    .select('id, created_at, metadata, is_read')
    .eq('user_id', user.id)
    .eq('event_type', 'MENTOR_CONNECT_REQUEST')
    .order('created_at', { ascending: false })

  const assignedTeams = assignments || []
  const requests = pendingRequests || []
  const connections = connectReqs || []

  const totalPending = requests.length + connections.filter((c: any) => !c.metadata?.response).length
  const totalProcessed = connections.filter((c: any) => c.metadata?.response).length
  const hasRequests = totalPending > 0
  const hasTeams = assignedTeams.length > 0

  const navLink = (href: string, label: string, bg: string, color: string) => (
    <Link href={href} style={{ fontSize: 13, fontWeight: 600, color, background: bg, padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
      {label}
    </Link>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>

      <nav style={{
        padding: '12px clamp(16px, 4vw, 52px)', display: 'flex', flexWrap: 'wrap', rowGap: 10, columnGap: 16,
        alignItems: 'center', justifyContent: 'space-between', background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>
            SproutNet <span style={{ fontSize: 13, color: '#2D6A4F', fontWeight: 500 }}>Mentorship</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2D6A4F', background: '#EAF4EE', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mentor
          </span>
          <span style={{ fontSize: 14, color: '#4A3F38', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</span>
          {navLink('/messages', 'Messages', '#F4A723', '#1C1410')}
          {navLink('/mentors', 'Browse Mentors', 'rgba(139,92,246,0.08)', '#8B5CF6')}
          {navLink('/notifications', 'Notifications', '#EAF4EE', '#2D6A4F')}
          <form action="/api/auth/signout" method="POST">
            <button type="submit" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9CA3A0', background: 'none', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(30px, 6vw, 42px)', fontWeight: 400, color: '#1C1410', letterSpacing: '-0.5px', marginBottom: 6 }}>
              Welcome, Mentor {profile.name.split(' ')[0]}.
            </h1>
            <p style={{ fontSize: 15, color: '#7A7068', fontWeight: 400 }}>
              Guide student teams, review requests, and foster engineering impact.
            </p>
          </div>
          <Link href="/mentor/profile" style={{ fontSize: 14, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE', border: '1px solid rgba(45,106,79,0.2)', padding: '10px 18px', borderRadius: 8, textDecoration: 'none' }}>
            Edit Profile & Availability →
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 40 }}>
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 12, padding: '22px 20px' }}>
            <div style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Active Teams</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 500, color: '#2D6A4F' }}>{assignedTeams.length}</span>
              <span style={{ fontSize: 14, color: '#9CA3A0' }}>/ {mentorProfile?.max_active_teams ?? 3}</span>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 12, padding: '22px 20px' }}>
            <div style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Pending</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 500, color: hasRequests ? '#F4A723' : '#9CA3A0' }}>{totalPending}</span>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 12, padding: '22px 20px' }}>
            <div style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Availability</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 500, color: mentorProfile?.availability_status === 'available' ? '#2D6A4F' : '#7A7068', textTransform: 'capitalize' }}>
                {mentorProfile?.availability_status || 'Set status →'}
              </span>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 12, padding: '22px 20px' }}>
            <div style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Students Connected</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 500, color: '#1C1410' }}>{totalProcessed + (mentorProfile?.students_connected || 0)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
          <Link href="/mentors" style={{ fontSize: 14, fontWeight: 600, color: '#8B5CF6', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', padding: '10px 22px', borderRadius: 10, textDecoration: 'none' }}>
            Browse Mentors →
          </Link>
          <Link href="/messages" style={{ fontSize: 14, fontWeight: 600, color: '#2D6A4F', background: '#fff', border: '1px solid rgba(45,106,79,0.2)', padding: '10px 22px', borderRadius: 10, textDecoration: 'none' }}>
            Open Messages →
          </Link>
          <Link href="/notifications" style={{ fontSize: 14, fontWeight: 600, color: '#1C1410', background: '#F4A723', border: 'none', padding: '10px 22px', borderRadius: 10, textDecoration: 'none' }}>
            View Notifications →
          </Link>
        </div>

        {/* Team Mentorship Requests */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 19, fontWeight: 700, color: '#1C1410' }}>
              Team Mentorship Requests
              {requests.length > 0 && <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 8px', borderRadius: 20, background: '#F4A723', color: '#1C1410' }}>{requests.length}</span>}
            </h2>
          </div>

          {requests.length === 0 ? (
            <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 14, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 15, color: '#7A7068' }}>No pending team mentorship requests.</div>
              <div style={{ fontSize: 13, color: '#9CA3A0', marginTop: 4 }}>Teams will appear here when students request your mentorship.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {requests.map((req: any) => (
                <div key={req.id} style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {req.teams?.problems?.domain || 'Problem'}
                    </div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: '#1C1410' }}>
                      {req.teams?.name}
                    </div>
                    <div style={{ fontSize: 14, color: '#4A3F38', marginTop: 2 }}>
                      {req.teams?.problems?.title}
                    </div>
                    {req.message && (
                      <div style={{ fontSize: 13, color: '#7A7068', fontStyle: 'italic', marginTop: 8, background: '#FAF8F4', padding: '8px 12px', borderRadius: 8 }}>
                        &ldquo;{req.message}&rdquo;
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#9CA3A0', marginTop: 8 }}>
                      Requested by <strong>{req.users?.name || req.users?.email || 'Unknown'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <form action="/api/mentors/request" method="POST">
                      <input type="hidden" name="requestId" value={req.id} />
                      <input type="hidden" name="action" value="accept" />
                      <button type="submit" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff', background: '#2D6A4F', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer' }}>
                        Accept ✓
                      </button>
                    </form>
                    <form action="/api/mentors/request" method="POST">
                      <input type="hidden" name="requestId" value={req.id} />
                      <input type="hidden" name="action" value="reject" />
                      <button type="submit" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#7A7068', background: '#F1EFEA', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer' }}>
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Individual Connection Requests */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 19, fontWeight: 700, color: '#1C1410' }}>
              Individual Connections
              {connections.filter((c: any) => !c.metadata?.response).length > 0 && (
                <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 8px', borderRadius: 20, background: '#8B5CF6', color: '#fff' }}>
                  {connections.filter((c: any) => !c.metadata?.response).length}
                </span>
              )}
            </h2>
          </div>

          {connections.length === 0 ? (
            <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 14, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🤝</div>
              <div style={{ fontSize: 15, color: '#7A7068' }}>No connection requests yet.</div>
              <div style={{ fontSize: 13, color: '#9CA3A0', marginTop: 4 }}>Students can send individual connection requests from the mentor directory.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 14 }}>
                {connections.filter((c: any) => !c.metadata?.response).length === 0 && connections.filter((c: any) => c.metadata?.response).length > 0 ? (
                  <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 14, padding: '24px', textAlign: 'center', color: '#9CA3A0', fontSize: 14 }}>
                    All requests processed. Showing history below.
                  </div>
                ) : (
                  connections.filter((c: any) => !c.metadata?.response).map((c: any) => {
                    const studentName = c.metadata?.student_name || 'A student'
                    const message = c.metadata?.message
                    const studentId = c.metadata?.student_id
                    const convId = c.metadata?.conversation_id
                    return (
                      <ConnectRequestCard
                        key={c.id}
                        id={c.id}
                        studentName={studentName}
                        message={message}
                        studentId={studentId}
                        conversationId={convId}
                      />
                    )
                  })
                )}
              </div>

              {connections.filter((c: any) => c.metadata?.response).length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, color: '#7A7068', marginBottom: 12 }}>
                    History ({connections.filter((c: any) => c.metadata?.response).length})
                  </h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {connections.filter((c: any) => c.metadata?.response).map((c: any) => {
                      const r = c.metadata?.response
                      return (
                        <div key={c.id} style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.06)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, color: r === 'accepted' ? '#2D6A4F' : '#DC2626' }}>
                              {r === 'accepted' ? '✓' : '✕'}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1410' }}>{c.metadata?.student_name || 'Student'}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: r === 'accepted' ? '#EAF4EE' : '#FEE2E2', color: r === 'accepted' ? '#2D6A4F' : '#DC2626', textTransform: 'capitalize' }}>{r}</span>
                          </div>
                          {c.metadata?.student_id && (
                            <Link href={`/messages?user=${c.metadata.student_id}`} style={{ fontSize: 13, color: '#2D6A4F', textDecoration: 'none', fontWeight: 500 }}>
                              Message →
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Assigned Teams */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 19, fontWeight: 700, color: '#1C1410' }}>
              My Teams
              {assignedTeams.length > 0 && <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 8px', borderRadius: 20, background: '#2D6A4F', color: '#fff' }}>{assignedTeams.length}</span>}
            </h2>
          </div>

          {!hasTeams ? (
            <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 14, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 15, color: '#7A7068' }}>No teams assigned yet.</div>
              <div style={{ fontSize: 13, color: '#9CA3A0', marginTop: 4 }}>Once you accept a mentorship request, the team will appear here with a full workspace.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {assignedTeams.map((a: any) => (
                <div key={a.team_id} style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '22px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {a.teams?.problems?.domain || 'General'}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EAF4EE', color: '#2D6A4F', textTransform: 'capitalize' }}>
                      {a.teams?.status || 'active'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: '#1C1410', marginBottom: 4 }}>
                    {a.teams?.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#7A7068', marginBottom: 16, flex: 1 }}>
                    {a.teams?.problems?.title}
                  </div>
                  <Link href={`/teams/${a.team_id}`} style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
                    Open Workspace →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
