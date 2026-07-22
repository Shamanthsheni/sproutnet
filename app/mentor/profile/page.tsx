import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function MentorProfilePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/mentor')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'mentor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { data: mentorProfile } = await admin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <nav style={{
        padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(250,248,244,0.94)', borderBottom: '1px solid rgba(28,20,16,0.07)'
      }}>
        <Link href="/mentor/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1C1410', fontWeight: 600 }}>
          ← Back to Mentor Dashboard
        </Link>
        <span style={{ fontSize: 14, color: '#4A3F38' }}>{profile.name}</span>
      </nav>

      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, fontWeight: 400, color: '#1C1410', marginBottom: 8 }}>
          Mentor Profile & Availability
        </h1>
        <p style={{ fontSize: 15, color: '#4A3F38', marginBottom: 32 }}>
          Manage your technology expertise, social profiles, and team capacity.
        </p>

        <form action="/api/mentors/profile" method="POST" style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1C1410' }}>Bio & Background</label>
            <textarea
              name="bio"
              rows={4}
              defaultValue={mentorProfile?.bio || ''}
              placeholder="Tell students about your engineering domain expertise..."
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1C1410' }}>Primary Skills (comma-separated)</label>
              <input
                type="text"
                name="skills"
                defaultValue={(mentorProfile?.skills || []).join(', ')}
                placeholder="System Architecture, Machine Learning, UI/UX"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1C1410' }}>Technologies (comma-separated)</label>
              <input
                type="text"
                name="technologies"
                defaultValue={(mentorProfile?.technologies || []).join(', ')}
                placeholder="Next.js, Python, PostgreSQL, PyTorch"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1C1410' }}>Availability Status</label>
              <select
                name="availability_status"
                defaultValue={mentorProfile?.availability_status || 'available'}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              >
                <option value="available">Available for new teams</option>
                <option value="busy">Busy (Limited capacity)</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1C1410' }}>Max Active Teams</label>
              <input
                type="number"
                name="max_active_teams"
                min={1} max={10}
                defaultValue={mentorProfile?.max_active_teams ?? 3}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#FAF8F4', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#4A3F38' }}>LinkedIn URL</label>
              <input
                type="text" name="linkedin_url" defaultValue={mentorProfile?.linkedin_url || ''} placeholder="https://linkedin.com/in/..."
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1C1410', background: '#FAF8F4', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 6, padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#4A3F38' }}>GitHub URL</label>
              <input
                type="text" name="github_url" defaultValue={mentorProfile?.github_url || ''} placeholder="https://github.com/..."
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1C1410', background: '#FAF8F4', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 6, padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#4A3F38' }}>Portfolio URL</label>
              <input
                type="text" name="portfolio_url" defaultValue={mentorProfile?.portfolio_url || ''} placeholder="https://yourportfolio.com"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1C1410', background: '#FAF8F4', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 6, padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button type="submit" style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer', marginTop: 8
          }}>
            Save Profile & Availability Settings →
          </button>
        </form>
      </div>
    </div>
  )
}
