'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteLogo } from '@/app/ui/site-shell'

type UserType = 'student' | 'poster' | null

const DEPARTMENTS = [
  'Computer Science',
  'Information Science',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'MBA',
  'MCA',
  'Other',
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year']

const ORG_TYPES = ['Startup', 'NGO / Non-profit', 'Company', 'Government Body', 'Research Institution', 'Individual', 'Other']

function JoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userType, setUserType] = useState<UserType>(() => {
    const role = searchParams.get('role')
    if (role === 'poster') return 'poster'
    if (role === 'student') return 'student'
    return null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dept, setDept] = useState('')
  const [year, setYear] = useState('')
  const [city, setCity] = useState('')
  const [orgType, setOrgType] = useState('')

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()
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
      options: { data: { name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const updates: Record<string, string> = { name }

      if (userType === 'student') {
        updates.dept = dept
        updates.year = year
      } else {
        updates.city = city
        updates.org_type = orgType
      }

      await supabase.from('users').update(updates).eq('id', data.user.id)
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="sn-page">
      <div className="sn-auth-shell">
        <div className="sn-auth-grid">
          <section className="sn-auth-hero">
            <div className="sn-stack-md">
              <SiteLogo />
              <span className="sn-eyebrow">
                <span className="sn-eyebrow-dot" />
                Account creation
              </span>
              <h1 className="sn-auth-title">
                Join the
                <br />
                challenge <em>network.</em>
              </h1>
              <p className="sn-auth-copy">
                The new sign-up flow is designed to feel more like onboarding into a real product. The account rules stay the same, but the surrounding experience is sharper and more confident.
              </p>
            </div>

            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>Students</strong>
                <span>Join to solve real problems, submit structured work, and build visible ranking proof.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Posters</strong>
                <span>Join to publish challenge briefs and receive submissions with real structure instead of vague idea dumps.</span>
              </div>
            </div>
          </section>

          <section className="sn-auth-card">
            {!userType ? (
              <div className="sn-stack-md">
                <div className="sn-stack-sm">
                  <div className="sn-section-label">Choose a role</div>
                  <h2 className="sn-card-title">Who are you joining as?</h2>
                  <p className="sn-card-copy">Selecting a role only changes the form fields shown here. The account rules and routes remain intact.</p>
                </div>

                <div className="sn-role-grid">
                  <button type="button" className="sn-role-card" onClick={() => setUserType('student')}>
                    <div className="sn-stack-sm">
                      <span className="sn-pill sn-pill-brand">Student</span>
                      <h3 className="sn-card-title">I want to solve problems.</h3>
                      <p className="sn-card-copy">Build structured submissions, move through milestones, and earn your Builder Score.</p>
                    </div>
                  </button>

                  <button type="button" className="sn-role-card" onClick={() => setUserType('poster')}>
                    <div className="sn-stack-sm">
                      <span className="sn-pill sn-pill-accent">Poster</span>
                      <h3 className="sn-card-title">I want to post challenges.</h3>
                      <p className="sn-card-copy">Create briefs for NGOs, companies, institutions, or individual problem statements.</p>
                    </div>
                  </button>
                </div>

                <p className="sn-card-copy">
                  Already have an account? <Link href="/login" style={{ color: 'var(--sn-brand-dark)', fontWeight: 700 }}>Sign in</Link>.
                </p>
              </div>
            ) : (
              <form className="sn-form-grid" onSubmit={handleRegister}>
                <div className="sn-stack-sm">
                  <button
                    type="button"
                    className="sn-btn sn-btn-ghost"
                    onClick={() => {
                      setUserType(null)
                      setError('')
                    }}
                    style={{ width: 'fit-content' }}
                  >
                    Back
                  </button>
                  <div className="sn-section-label">{userType === 'student' ? 'Student onboarding' : 'Poster onboarding'}</div>
                  <h2 className="sn-card-title">
                    {userType === 'student' ? 'Create your builder account' : 'Create your poster account'}
                  </h2>
                  <p className="sn-card-copy">
                    {userType === 'student'
                      ? 'The visual experience is new, but the account policy is the same: approved student domains only during the current phase.'
                      : 'Use the poster flow to create an organisation-facing account for posting and reviewing challenges.'}
                  </p>
                </div>

                {error ? <div className="sn-alert">{error}</div> : null}

                <div className="sn-field">
                  <label className="sn-label" htmlFor="join-name">
                    Full name
                  </label>
                  <input id="join-name" value={name} onChange={(event) => setName(event.target.value)} required className="sn-input" />
                </div>

                <div className="sn-field">
                  <label className="sn-label" htmlFor="join-email">
                    {userType === 'student' ? 'College email' : 'Email address'}
                  </label>
                  <input
                    id="join-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder={userType === 'student' ? 'you@jyothyit.ac.in' : 'you@company.com'}
                    className="sn-input"
                  />
                </div>

                <div className="sn-field">
                  <label className="sn-label" htmlFor="join-password">
                    Password
                  </label>
                  <input
                    id="join-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    className="sn-input"
                  />
                </div>

                {userType === 'student' ? (
                  <>
                    <div className="sn-field">
                      <label className="sn-label" htmlFor="join-department">
                        Department
                      </label>
                      <select id="join-department" value={dept} onChange={(event) => setDept(event.target.value)} required className="sn-select">
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sn-field">
                      <label className="sn-label" htmlFor="join-year">
                        Year
                      </label>
                      <select id="join-year" value={year} onChange={(event) => setYear(event.target.value)} required className="sn-select">
                        <option value="">Select year</option>
                        {YEARS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sn-field">
                      <label className="sn-label" htmlFor="join-city">
                        City
                      </label>
                      <input id="join-city" value={city} onChange={(event) => setCity(event.target.value)} required className="sn-input" />
                    </div>

                    <div className="sn-field">
                      <label className="sn-label" htmlFor="join-org-type">
                        Organisation type
                      </label>
                      <select id="join-org-type" value={orgType} onChange={(event) => setOrgType(event.target.value)} required className="sn-select">
                        <option value="">Select type</option>
                        {ORG_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <button type="submit" className="sn-btn sn-btn-primary" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <p className="sn-card-copy">
                  Already have an account? <Link href="/login" style={{ color: 'var(--sn-brand-dark)', fontWeight: 700 }}>Sign in</Link>.
                </p>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="sn-page"><div className="sn-auth-shell" /></div>}>
      <JoinContent />
    </Suspense>
  )
}
