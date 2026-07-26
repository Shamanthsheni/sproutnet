import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ConnectActions from './connect-actions'

const AVATAR_COLORS = ['#2D6A4F', '#1E40AF', '#9C6344', '#6B4C2A', '#3D8A65', '#4A3F38', '#7C3AED', '#BE123C']

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default async function MentorConnectPage({ params }: { params: Promise<{ notificationId: string }> }) {
  const { notificationId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/mentor')

  const { data: mentorProfile } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', user.id)
    .single()

  if (!mentorProfile || (mentorProfile.role !== 'mentor' && mentorProfile.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { data: notif } = await admin
    .from('notifications')
    .select('id, metadata, is_read')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single()

  if (!notif) return notFound()

  if (!notif.is_read) {
    await admin.from('notifications').update({ is_read: true }).eq('id', notificationId)
  }

  const studentId = notif.metadata?.student_id as string | undefined
  if (!studentId) return notFound()

  const { data: student } = await admin
    .from('users')
    .select('id, name, dept, year, role, bio, github, linkedin, twitter, avatar_url, builder_score, profile_slug')
    .eq('id', studentId)
    .single()

  if (!student) return notFound()

  const message = notif.metadata?.message as string | undefined
  const conversationId = notif.metadata?.conversation_id as string | undefined
  const ac = avatarColor(student.name)
  const init = initials(student.name)

  const isPending = !notif.metadata?.response

  const stats = [
    { label: 'Builder Score', value: student.builder_score ?? 0, color: '#F4A723' },
  ]

  const socialLinks: { label: string; url: string; icon: string }[] = []
  if (student.github) socialLinks.push({ label: 'GitHub', url: student.github, icon: '⌨' })
  if (student.linkedin) socialLinks.push({ label: 'LinkedIn', url: student.linkedin, icon: '🔗' })
  if (student.twitter) socialLinks.push({ label: 'Twitter', url: student.twitter, icon: '𝕏' })

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
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#1C1410', background: '#F4A723', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mentor
          </span>
          <span style={{ fontSize: 14, color: '#4A3F38', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mentorProfile.name}</span>
          <Link href="/mentor/dashboard" style={{ fontSize: 13, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href="/messages" style={{ fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
            Messages
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>

        {isPending && (
          <div style={{ background: '#fff', border: '1.5px solid rgba(139,92,246,0.15)', borderRadius: 14, padding: '18px 24px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Pending Connection Request
              </div>
              <div style={{ fontSize: 14, color: '#4A3F38', marginTop: 4 }}>
                This student has requested mentorship from you.
              </div>
            </div>
            <ConnectActions notificationId={notificationId} conversationId={conversationId} studentId={studentId} />
          </div>
        )}

        {!isPending && (
          <div style={{ background: '#fff', border: `1.5px solid ${notif.metadata?.response === 'accepted' ? 'rgba(45,106,79,0.2)' : 'rgba(220,38,38,0.15)'}`, borderRadius: 14, padding: '18px 24px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: notif.metadata?.response === 'accepted' ? '#2D6A4F' : '#DC2626' }}>
                Request {notif.metadata?.response === 'accepted' ? 'Accepted' : 'Declined'}
              </div>
            </div>
            {notif.metadata?.response === 'accepted' && (
              <Link href={`/messages?user=${studentId}`} style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: '#2D6A4F', padding: '9px 18px', borderRadius: 8, textDecoration: 'none' }}>
                Start Chat →
              </Link>
            )}
          </div>
        )}

        {/* Student Profile */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar + Name + Stats */}
          <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: '28px 20px', textAlign: 'center' }}>
              {student.avatar_url ? (
                <img src={student.avatar_url} alt={student.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: '#fff', margin: '0 auto 12px' }}>
                  {init}
                </div>
              )}
              <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1C1410', margin: 0 }}>{student.name}</h1>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE', padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{student.role}</span>
                <span style={{ fontSize: 13, color: '#6B5E52' }}>{[student.dept, student.year].filter(Boolean).join(' · ')}</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 18, textAlign: 'center' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#9CA3A0', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {message && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Message</div>
                <p style={{ fontSize: 14, color: '#4A3F38', fontStyle: 'italic', lineHeight: 1.7, margin: 0, background: '#FAF8F4', padding: '12px 16px', borderRadius: 8 }}>
                  &ldquo;{message}&rdquo;
                </p>
              </div>
            )}

            {student.bio && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>About</div>
                <p style={{ fontSize: 14, color: '#4A3F38', lineHeight: 1.7, margin: 0 }}>{student.bio}</p>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.06)', padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Connect</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {socialLinks.map(s => (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#4A3F38', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15 }}>{s.icon}</span> {s.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {student.profile_slug && (
              <Link href={`/profile/${student.profile_slug}`} style={{ fontSize: 14, fontWeight: 600, color: '#8B5CF6', background: 'rgba(139,92,246,0.08)', padding: '10px 18px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
                View Full Public Profile →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
