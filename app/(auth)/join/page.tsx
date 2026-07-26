'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type UserType = 'student' | 'poster' | 'mentor' | null

const DEPARTMENTS = [
  'Computer Science', 'Information Science', 'AIML',
  'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Biotechnology', 'MBA', 'MCA', 'Other'
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year']

const ORG_TYPES = ['Startup', 'NGO / Non-profit', 'Company', 'Government Body', 'Research Institution', 'Individual', 'Other']

function JoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dept, setDept] = useState('')
  const [year, setYear] = useState('')
  const [city, setCity] = useState('')
  const [orgType, setOrgType] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  const userType = selectedUserType || (searchParams.get('role') === 'poster' ? 'poster' : searchParams.get('role') === 'mentor' ? 'mentor' : null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    if (userType === 'student') {
      const domain = '@' + email.split('@')[1]
      const { data: domainCheck } = await supabase
        .from('allowed_domains')
        .select('domain')
        .eq('domain', domain)
        .eq('active', true)
        .single()

      if (!domainCheck) {
        setError('Your college email is not yet registered on SproutNet. Phase 1 is open to @jyothyit.ac.in students only.')
        setLoading(false)
        return
      }
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: userType! } }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const updates: Record<string, string> = { name, role: userType! }
      if (userType === 'student') {
        updates.dept = dept
        updates.year = year
      } else if (userType === 'poster') {
        updates.city = city
        updates.org_type = orgType
      }
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (userType === 'mentor') {
        const mentorSkills = skills.split(',').map(s => s.trim()).filter(Boolean)
        const mentorTechs = technologies.split(',').map(t => t.trim()).filter(Boolean)
        await supabase.from('mentor_profiles').insert({
          user_id: data.user.id,
          bio: bio || null,
          skills: mentorSkills,
          technologies: mentorTechs,
          experience_years: parseInt(experienceYears) || 0,
          linkedin_url: linkedinUrl || null,
          github_url: githubUrl || null,
        })
        router.push('/mentor/dashboard')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }

    setLoading(false)
  }

  const inp: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: '#1C1410',
    background: '#FAF8F4',
    border: '1.5px solid rgba(28,20,16,0.12)',
    borderRadius: 8,
    padding: '11px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  }

  const lbl: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: '#1C1410'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
              <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
              <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
            </svg>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: '#1C1410' }}>SproutNet</span>
          </Link>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, fontWeight: 400, color: '#1C1410', letterSpacing: '-0.5px', display: 'block' }}>
            Join SproutNet.
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#4A3F38', marginTop: 8, fontWeight: 300 }}>
            Who are you joining as?
          </p>
        </div>

        {/* Role selector */}
        {!userType && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setSelectedUserType('student')}
              style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.1)', borderRadius: 12, padding: 24, cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 8px rgba(28,20,16,0.06)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = '#2D6A4F'; (e.currentTarget).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(28,20,16,0.1)'; (e.currentTarget).style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🎓</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600, color: '#1C1410', marginBottom: 6 }}>I&apos;m a Student</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4A3F38', fontWeight: 300 }}>Browse real problems, build structured solutions, earn your Builder Score.</div>
              <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2D6A4F', background: '#EAF4EE', padding: '4px 10px', borderRadius: 999, display: 'inline-block' }}>
                @jyothyit.ac.in only · Phase 1
              </div>
            </button>

            <button
              onClick={() => setSelectedUserType('mentor')}
              style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.1)', borderRadius: 12, padding: 24, cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 8px rgba(28,20,16,0.06)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = '#8B5CF6'; (e.currentTarget).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(28,20,16,0.1)'; (e.currentTarget).style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🧭</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600, color: '#1C1410', marginBottom: 6 }}>I want to Mentor</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4A3F38', fontWeight: 300 }}>Guide student teams, share your expertise, and shape the next generation of builders.</div>
              <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8B5CF6', background: 'rgba(139,92,246,0.08)', padding: '4px 10px', borderRadius: 999, display: 'inline-block' }}>
                Industry Experts · Alumni · Faculty
              </div>
            </button>

            <button
              onClick={() => setSelectedUserType('poster')}
              style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.1)', borderRadius: 12, padding: 24, cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 8px rgba(28,20,16,0.06)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = '#F4A723'; (e.currentTarget).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(28,20,16,0.1)'; (e.currentTarget).style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🏢</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600, color: '#1C1410', marginBottom: 6 }}>I have a Problem to Post</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4A3F38', fontWeight: 300 }}>Post real challenges. Get structured solutions from India&apos;s sharpest students.</div>
              <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1E40AF', background: 'rgba(30,64,175,0.08)', padding: '4px 10px', borderRadius: 999, display: 'inline-block' }}>
                NGOs · Companies · Individuals
              </div>
            </button>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9CA3A0', textAlign: 'center', marginTop: 8 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* Registration form */}
        {userType && (
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: '36px 40px', boxShadow: '0 4px 24px rgba(28,20,16,0.07)' }}>
            <button
              onClick={() => { setSelectedUserType(null); setError(''); router.replace('/join') }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9CA3A0', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ← Back
            </button>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{userType === 'student' ? '🎓' : userType === 'mentor' ? '🧭' : '🏢'}</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600, color: '#1C1410' }}>
                {userType === 'student' ? 'Create Student Account' : userType === 'mentor' ? 'Create Mentor Account' : 'Create Poster Account'}
              </div>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={lbl}>Full name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Arjun Verma" style={inp}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={lbl}>{userType === 'student' ? 'College email (@jyothyit.ac.in)' : 'Email address'}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder={userType === 'student' ? 'you@jyothyit.ac.in' : 'you@company.com'} style={inp}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={lbl}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" style={inp}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
              </div>

              {userType === 'student' && (<>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Department</label>
                  <select value={dept} onChange={e => setDept(e.target.value)} required style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Year</label>
                  <select value={year} onChange={e => setYear(e.target.value)} required style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>)}

              {userType === 'poster' && (<>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} required placeholder="Bangalore" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Organisation type</label>
                  <select value={orgType} onChange={e => setOrgType(e.target.value)} required style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}>
                    <option value="">Select type</option>
                    {ORG_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </>)}

              {userType === 'mentor' && (<>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell students about your expertise and what you can help with..." style={{ ...inp, resize: 'vertical', minHeight: 70 }}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Skills (comma-separated)</label>
                  <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="Web Development, System Design, AI/ML" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Technologies (comma-separated)</label>
                  <input type="text" value={technologies} onChange={e => setTechnologies(e.target.value)} placeholder="React, Python, PostgreSQL, AWS" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Years of experience</label>
                  <input type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} min={0} max={50} placeholder="5" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>LinkedIn URL (optional)</label>
                  <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>GitHub URL (optional)</label>
                  <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/yourhandle" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
                </div>
              </>)}

              <button type="submit" disabled={loading} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1C1410',
                background: loading ? '#F9C05A' : '#F4A723', border: 'none', borderRadius: 8,
                padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
                boxShadow: '0 2px 10px rgba(244,167,35,0.3)'
              }}>
                {loading ? 'Creating account...' : 'Create account →'}
              </button>

              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9CA3A0', textAlign: 'center' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FAF8F4' }} />}>
      <JoinContent />
    </Suspense>
  )
}
