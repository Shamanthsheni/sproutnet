'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Problem = {
  id: string
  title: string
  domain: string
  milestones: number
  deadline: string
}

type User = {
  id: string
  name: string
  dept: string
  year: string
}

type ExistingSubmission = {
  id: string
  stage: string
  milestone: number
  f_understanding: string
  f_solution: string
  f_impact: string
  f_rootcause: string | null
  f_feasibility: string | null
  f_risks: string | null
  f_implementation: string | null
  status: string
  ai_feedback: string | null
}

const STAGE1_FIELDS = [
  { key: 'f_understanding', label: 'Problem Understanding', placeholder: 'In your own words, what is the core problem? Who does it affect and how? What evidence do you have that this is real?', hint: 'Be specific. Avoid restating the problem brief — show you understand it.' },
  { key: 'f_solution', label: 'Proposed Solution', placeholder: 'What is your solution? Describe it clearly enough that someone unfamiliar could understand it in 2 minutes.', hint: 'Focus on the core idea first, not implementation details.' },
  { key: 'f_impact', label: 'Expected Impact', placeholder: 'If your solution works, what changes? Who benefits? By how much? Can you quantify the impact?', hint: 'Use numbers where possible. "Reduces X by Y%" is stronger than "improves X".' },
]

const STAGE2_FIELDS = [
  { key: 'f_rootcause', label: 'Root Cause Analysis', placeholder: 'Why does this problem exist? What are the underlying causes — not just symptoms? Use a 5-Why or fishbone approach if helpful.', hint: 'Surface-level causes lead to surface-level solutions. Go deeper.' },
  { key: 'f_feasibility', label: 'Feasibility Assessment', placeholder: 'Is your solution technically, economically, and socially feasible? What resources, skills, and time would be needed? What already exists that you can build on?', hint: 'Be honest about what you don\'t know. Acknowledging uncertainty is strength.' },
  { key: 'f_risks', label: 'Risks & Limitations', placeholder: 'What could go wrong? What are the biggest risks to your solution? What assumptions are you making that could be wrong?', hint: 'Every solution has risks. The best submissions name them honestly.' },
  { key: 'f_implementation', label: 'Implementation Plan', placeholder: 'How would this actually get built and deployed? What are the key steps, timeline, and team needed? What would you do first?', hint: 'Think in phases. What\'s the MVP? What comes after?' },
]

export default function SubmitPage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [selectedMilestone, setSelectedMilestone] = useState(1)
  const [stage, setStage] = useState<'draft' | 'full'>('draft')
  const [existing, setExisting] = useState<ExistingSubmission | null>(null)

  // Form state
  const [fields, setFields] = useState<Record<string, string>>({
    f_understanding: '',
    f_solution: '',
    f_impact: '',
    f_rootcause: '',
    f_feasibility: '',
    f_risks: '',
    f_implementation: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('id, name, dept, year, role')
        .eq('id', authUser.id)
        .single()

      if (!profile || profile.role !== 'student') {
        router.push('/dashboard')
        return
      }
      setUser(profile)

      const { data: enroll } = await supabase
        .from('enrollments')
        .select('id')
        .eq('problem_id', problemId)
        .eq('student_id', authUser.id)
        .eq('status', 'active')
        .limit(1)
      if (!enroll || enroll.length === 0) {
        router.push(`/problems/${problemId}`)
        return
      }

      const { data: prob } = await supabase
        .from('problems')
        .select('id, title, domain, milestones, deadline')
        .eq('id', problemId)
        .single()
      setProblem(prob)

      // Load existing submission for milestone 1
      await loadSubmission(supabase, authUser.id, 1, prob?.milestones ?? 3)
      setLoading(false)
    }
    load()
  }, [problemId, router])

  async function loadSubmission(supabase: ReturnType<typeof createClient>, userId: string, milestone: number, totalMilestones: number) {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('problem_id', problemId)
      .eq('student_id', userId)
      .eq('milestone', milestone)
      .single()

    if (data) {
      setExisting(data as ExistingSubmission)
      setStage(data.stage as 'draft' | 'full')
      setFields({
        f_understanding: data.f_understanding ?? '',
        f_solution: data.f_solution ?? '',
        f_impact: data.f_impact ?? '',
        f_rootcause: data.f_rootcause ?? '',
        f_feasibility: data.f_feasibility ?? '',
        f_risks: data.f_risks ?? '',
        f_implementation: data.f_implementation ?? '',
      })
    } else {
      setExisting(null)
      setStage('draft')
      setFields({
        f_understanding: '', f_solution: '', f_impact: '',
        f_rootcause: '', f_feasibility: '', f_risks: '', f_implementation: '',
      })
    }
  }

  async function handleMilestoneChange(m: number) {
    setSelectedMilestone(m)
    setSaved(false)
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser && problem) {
      await loadSubmission(supabase, authUser.id, m, problem.milestones)
    }
  }

  async function saveDraft() {
    if (!user || !problem) return
    setSaving(true)
    setError('')

    const supabase = createClient()

    const payload = {
      problem_id: problemId,
      student_id: user.id,
      milestone: selectedMilestone,
      total_milestones: problem.milestones,
      dept: user.dept ?? 'Unknown',
      year: user.year ?? 'Unknown',
      stage: 'draft' as const,
      status: 'draft' as const,
      f_understanding: fields.f_understanding,
      f_solution: fields.f_solution,
      f_impact: fields.f_impact,
    }

    if (existing) {
      await supabase.from('submissions').update(payload).eq('id', existing.id)
    } else {
      const { data, error: insertError } = await supabase
        .from('submissions')
        .insert(payload)
        .select()
        .single()
      if (insertError) { setError(insertError.message); setSaving(false); return }
      if (data) setExisting(data as ExistingSubmission)
    }

    setSaved(true)
    setStage('draft')
    setSaving(false)
  }

  async function submitFull() {
    if (!user || !problem) return
    if (!existing) { setError('Please save your Stage 1 draft first.'); return }

    const missing = STAGE2_FIELDS.filter(f => !fields[f.key]?.trim())
    if (missing.length > 0) {
      setError(`Please complete: ${missing.map(f => f.label).join(', ')}`)
      return
    }

    setSaving(true)
    setError('')

    const supabase = createClient()

    await supabase.from('submissions').update({
      stage: 'full',
      status: 'pending',
      f_rootcause: fields.f_rootcause,
      f_feasibility: fields.f_feasibility,
      f_risks: fields.f_risks,
      f_implementation: fields.f_implementation,
    }).eq('id', existing.id)

    setSaved(true)
    setStage('full')
    setSaving(false)

    // Redirect to dashboard after 1.5s
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const stage1Complete = fields.f_understanding.trim() && fields.f_solution.trim() && fields.f_impact.trim()
  const stage2Complete = STAGE2_FIELDS.every(f => fields[f.key]?.trim())
  const completedFields = Object.values(fields).filter(v => v.trim()).length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#9CA3A0' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        minHeight: 66,
        height: 'auto',
        padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: 10,
        columnGap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href={`/problems/${problemId}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', rowGap: 8 }}>
          {/* Progress indicator */}
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
            color: '#2D6A4F', background: '#EAF4EE',
            padding: '6px 14px', borderRadius: 999
          }}>
            {completedFields} / 7 fields
          </div>
          <div className="sn-nav-actions" style={{ display: 'flex', alignItems: 'center' }}>
            <Link href={`/problems/${problemId}`} style={{ fontSize: 14, color: '#4A3F38', textDecoration: 'none' }}>
              ← Back to problem
            </Link>
          </div>
        </div>
        <details className="sn-mobile-menu">
          <summary aria-label="Open navigation menu">
            <span className="sn-menu-icon" aria-hidden="true"></span>
            <span className="sn-menu-label">Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            <Link href={`/problems/${problemId}`}>Back to problem</Link>
          </div>
        </details>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            color: '#2D6A4F', letterSpacing: '0.1em',
            textTransform: 'uppercase', marginBottom: 10
          }}>
            // submitting a solution
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(26px, 5.5vw, 32px)', fontWeight: 400,
            color: '#1C1410', letterSpacing: '-0.3px',
            lineHeight: 1.2, marginBottom: 8
          }}>
            {problem?.title}
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3A0' }}>
            {user?.name} · {user?.dept} · {user?.year}
          </p>
        </div>

        {/* Milestone selector */}
        {problem && problem.milestones > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', rowGap: 8 }}>
            {Array.from({ length: problem.milestones }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handleMilestoneChange(i + 1)}
                style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                  padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
                  border: `1.5px solid ${selectedMilestone === i + 1 ? '#2D6A4F' : 'rgba(28,20,16,0.12)'}`,
                  background: selectedMilestone === i + 1 ? '#2D6A4F' : '#fff',
                  color: selectedMilestone === i + 1 ? '#fff' : '#4A3F38',
                }}
              >
                Milestone {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Stage indicator */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)',
          borderRadius: 12, padding: 6, marginBottom: 32
        }}>
          {[
            { id: 'draft', label: 'Stage 1 — Idea Draft', desc: '3 fields · ~10 min', done: !!stage1Complete },
            { id: 'full', label: 'Stage 2 — Full Submission', desc: '4 fields · ~30 min', done: !!stage2Complete },
          ].map((s, i) => (
            <div key={s.id} style={{
              flex: '1 1 260px', padding: '14px 20px', borderRadius: 8,
              background: stage === s.id ? '#1C1410' : 'transparent',
              cursor: 'pointer'
            }} onClick={() => existing && setStage(s.id as 'draft' | 'full')}>
              <div style={{
                fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
                color: stage === s.id ? '#FAF8F4' : '#4A3F38',
                marginBottom: 2
              }}>
                {s.done ? '✓ ' : `${i + 1}. `}{s.label}
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                color: stage === s.id ? 'rgba(250,248,244,0.4)' : '#9CA3A0'
              }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 24,
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#DC2626'
          }}>
            {error}
          </div>
        )}

        {/* Success */}
        {saved && stage === 'full' && (
          <div style={{
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 24,
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#16A34A'
          }}>
            ✓ Full submission saved! Redirecting to dashboard...
          </div>
        )}

        {/* Stage 1 Fields */}
        {stage === 'draft' && (
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: '#9CA3A0', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 20
            }}>
              Stage 1 — Idea Draft
            </div>

            {STAGE1_FIELDS.map((field, i) => (
              <div key={field.key} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                    color: '#2D6A4F', background: '#EAF4EE',
                    padding: '2px 8px', borderRadius: 4
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <label style={{
                    fontFamily: 'Sora, sans-serif', fontSize: 14,
                    fontWeight: 600, color: '#1C1410'
                  }}>
                    {field.label}
                  </label>
                </div>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  color: '#9CA3A0', marginBottom: 8, fontStyle: 'italic'
                }}>
                  💡 {field.hint}
                </p>
                <textarea
                  value={fields[field.key]}
                  onChange={e => setFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={5}
                  style={{
                    width: '100%', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, color: '#1C1410',
                    background: '#fff', border: '1.5px solid rgba(28,20,16,0.1)',
                    borderRadius: 10, padding: '14px 16px',
                    resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box', lineHeight: 1.65,
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.1)'}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', rowGap: 10 }}>
              <button onClick={saveDraft} disabled={saving || !stage1Complete} style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600,
                color: '#1C1410', background: saving ? '#F9C05A' : '#F4A723',
                border: 'none', borderRadius: 8,
                padding: '13px 32px', cursor: saving ? 'not-allowed' : 'pointer',
                flex: '1 1 220px',
                boxShadow: '0 2px 10px rgba(244,167,35,0.3)'
              }}>
                {saving ? 'Saving...' : saved ? '✓ Saved — Continue to Stage 2 →' : 'Save Draft →'}
              </button>

              {saved && (
                <button onClick={() => setStage('full')} style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600,
                  color: '#FAF8F4', background: '#2D6A4F',
                  border: 'none', borderRadius: 8,
                  padding: '13px 32px', cursor: 'pointer',
                  flex: '1 1 220px'
                }}>
                  Go to Stage 2 →
                </button>
              )}
            </div>

            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 12,
              color: '#9CA3A0', marginTop: 14
            }}>
              Your draft is saved privately. Only Stage 2 submissions enter the judging queue.
            </p>
          </div>
        )}

        {/* Stage 2 Fields */}
        {stage === 'full' && (
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: '#9CA3A0', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 20
            }}>
              Stage 2 — Full Submission
            </div>

            {/* Stage 1 summary */}
            <div style={{
              background: '#EAF4EE', border: '1px solid rgba(45,106,79,0.15)',
              borderRadius: 10, padding: '16px 20px', marginBottom: 28
            }}>
              <div style={{
                fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600,
                color: '#2D6A4F', marginBottom: 4
              }}>
                ✓ Stage 1 complete
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#2D6A4F', opacity: 0.7 }}>
                Problem Understanding, Proposed Solution, and Expected Impact saved.
              </div>
            </div>

            {STAGE2_FIELDS.map((field, i) => (
              <div key={field.key} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                    color: '#F4A723', background: 'rgba(244,167,35,0.1)',
                    padding: '2px 8px', borderRadius: 4
                  }}>
                    {String(i + 4).padStart(2, '0')}
                  </span>
                  <label style={{
                    fontFamily: 'Sora, sans-serif', fontSize: 14,
                    fontWeight: 600, color: '#1C1410'
                  }}>
                    {field.label}
                  </label>
                </div>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  color: '#9CA3A0', marginBottom: 8, fontStyle: 'italic'
                }}>
                  💡 {field.hint}
                </p>
                <textarea
                  value={fields[field.key]}
                  onChange={e => setFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={5}
                  style={{
                    width: '100%', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, color: '#1C1410',
                    background: '#fff', border: '1.5px solid rgba(28,20,16,0.1)',
                    borderRadius: 10, padding: '14px 16px',
                    resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box', lineHeight: 1.65,
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#F4A723'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.1)'}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', rowGap: 10 }}>
              <button onClick={() => setStage('draft')} style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
                color: '#4A3F38', background: '#fff',
                border: '1.5px solid rgba(28,20,16,0.12)',
                borderRadius: 8, padding: '13px 24px', cursor: 'pointer',
                flex: '1 1 220px'
              }}>
                ← Back to Stage 1
              </button>

              <button onClick={submitFull} disabled={saving || !stage2Complete} style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600,
                color: '#1C1410',
                background: stage2Complete ? '#F4A723' : 'rgba(244,167,35,0.3)',
                border: 'none', borderRadius: 8,
                padding: '13px 32px',
                cursor: stage2Complete ? 'pointer' : 'not-allowed',
                flex: '1 1 220px',
                boxShadow: stage2Complete ? '0 2px 10px rgba(244,167,35,0.3)' : 'none'
              }}>
                {saving ? 'Submitting...' : 'Submit for Judging →'}
              </button>
            </div>

            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 12,
              color: '#9CA3A0', marginTop: 14
            }}>
              Once submitted, your solution enters the blind judging queue. All 7 fields are required.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
