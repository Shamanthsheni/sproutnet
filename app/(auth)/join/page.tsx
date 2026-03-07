'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type UserType = 'student' | 'poster' | null

const DEPARTMENTS = [
  'Computer Science', 'Information Science', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Biotechnology', 'MBA', 'MCA', 'Other'
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year']

const ORG_TYPES = ['Startup', 'NGO / Non-profit', 'Company', 'Government Body', 'Research Institution', 'Individual', 'Other']

export default function JoinPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<UserType>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dept, setDept] = useState('')
  const [year, setYear] = useState('')
  const [city, setCity] = useState('')
  const [orgType, setOrgType] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Validate student email domain
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

    // Sign up with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Update additional profile fields
      const updates: Record<string, string> = { name }
      if (userType === 'student') {
        updates.dept = dept
        updates.year = year
      } else {
        updates.city = city
        updates.org_type = orgType
      }

      await supabase
        .from('users')
        .update(updates)
        .eq('id', data.user.id)

      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  const inputStyle = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 14,
    color: '#1C1410',
    background: '#FAF8F4',
    border: '1.5px solid rgba(28,20,16,0.12)',
    borderRadius: 8,
    padding: '11px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: '#1C1410'
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
              <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
              <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
            </svg>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: '#1C1410' }}>
              SproutNet
            </span>
          </Link>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 32,
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px'
          }}>
            Join SproutNet.
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 15,
            color: '#4A3F38',
            marginTop: 8,
            fontWeight: 300
          }}>
            Who are you joining as?
          </p>
        </div>

        {/* Role selector — shown first */}
        {!userType && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setUserType('student')}
              style={{
                background: '#fff',
                border: '1.5px solid rgba(28,20,16,0.1)',
                borderRadius: 12,
                padding: '24px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(28,20,16,0.06)'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#2D6A4F'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(28,20,16,0.1)'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🎓</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, color: '#1C1410', marginBottom: 6 }}>
                I&apos;m a Student
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#4A3F38', fontWeight: 300 }}>
                Browse real problems, build structured solutions, earn your Builder Score.
              </div>
              <div style={{
                marginTop: 12,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#2D6A4F',
                background: '#EAF4EE',
                padding: '4px 10px',
                borderRadius: 999,
                display: 'inline-block'
              }}>
                @jyothyit.ac.in only · Phase 1
              </div>
            </button>

            <button
              onClick={() => setUserType('poster')}
              style={{
                background: '#fff',
                border: '1.5px solid rgba(28,20,16,0.1)',
                borderRadius: 12,
                padding: '24px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(28,20,16,0.06)'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#F4A723'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(28,20,16,0.1)'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🏢</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, color: '#1C1410', marginBottom: 6 }}>
                I have a Problem to Post
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#4A3F38', fontWeight: 300 }}>
                Post real challenges. Get structured solutions from India&apos;s sharpest students.
              </div>
              <div style={{
                marginTop: 12,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#1E40AF',
                background: 'rgba(30,64,175,0.08)',
                padding: '4px 10px',
                borderRadius: 999,
                display: 'inline-block'
              }}>
                NGOs · Companies · Individuals
              </div>
            </button>

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#9CA3A0',
              textAlign: 'center',
              marginTop: 8
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Registration form */}
        {userType && (
          <div style={{
            background: '#fff',
            border: '1.5px solid rgba(28,20,16,0.08)',
            borderRadius: 14,
            padding: '36px 40px',
            boxShadow: '0 4px 24px rgba(28,20,16,0.07)'
          }}>
            {/* Back button */}
            <button
              onClick={() => { setUserType(null); setError('') }}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: '#9CA3A0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              ← Back
            </button>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>
                {userType === 'student' ? '🎓' : '🏢'}
              </div>
              <div style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#1C1410'
              }}>
                {userType === 'student' ? 'Create Student Account' : 'Create Poster Account'}
              </div>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {error && (
                <div style={{
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  color: '#DC2626'
                }}>
                  {error}
                </div>
              )}

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Arjun Verma"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
                />
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>
                  {userType === 'student' ? 'College email (@jyothyit.ac.in)' : 'Email address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={userType === 'student' ? 'you@jyothyit.ac.in' : 'you@company.com'}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
                />
              </div>

              {/* Student fields */}
              {userType === 'student' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Department</label>
                    <select
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                      onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Year</label>
                    <select
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                      onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
                    >
                      <option value="">Select year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Poster fields */}
              {userType === 'poster' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required
                      placeholder="Bangalore"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                      onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Organisation type</label>
                    <select
                      value={orgType}
                      onChange={e => setOrgType(e.target.value)}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                      onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'}
                    >
                      <option value="">Select type</option>
                      {ORG_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1C1410',
                  background: loading ? '#F9C05A' : '#F4A723',
                  border: 'none',
                  borderRadius: 8,
                  padding: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                  boxShadow: '0 2px 10px rgba(244,167,35,0.3)'
                }}
              >
                {loading ? 'Creating account...' : 'Create account →'}
              </button>

              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                color: '#9CA3A0',
                textAlign: 'center'
              }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}