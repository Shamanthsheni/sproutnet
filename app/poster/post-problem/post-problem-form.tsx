'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SectionIntro, SiteFooter } from '@/app/ui/site-shell'
import { createClient } from '@/lib/supabase/client'
import { PosterHeader } from '@/app/poster/ui/poster-shell'

const DOMAINS = [
  'AI & Data',
  'Climate',
  'Public Infrastructure',
  'Healthcare',
  'Agriculture',
  'Education',
  'Urban Mobility',
  'Civic Technology',
]

const PROBLEM_TYPES = [
  { value: 'public_impact', label: 'Public Impact' },
  { value: 'industry_challenge', label: 'Industry Challenge' },
]

type Props = {
  posterName: string
}

export default function PostProblemForm({ posterName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPopup, setShowPopup] = useState(false)

  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState(DOMAINS[0])
  const [problemType, setProblemType] = useState(PROBLEM_TYPES[0].value)
  const [rewardAmount, setRewardAmount] = useState('')
  const [milestones, setMilestones] = useState('2')
  const [deadline, setDeadline] = useState('')
  const [judgingDeadline, setJudgingDeadline] = useState('')
  const [context, setContext] = useState('')
  const [problemStmt, setProblemStmt] = useState('')
  const [scope, setScope] = useState('')
  const [constraints, setConstraints] = useState('')
  const [deliverables, setDeliverables] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (judgingDeadline && deadline && judgingDeadline < deadline) {
      setError('Judging deadline must be on or after the submission deadline.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login/poster')
      return
    }

    const payload = {
      title: title.trim(),
      domain,
      problem_type: problemType,
      status: 'open',
      reward_amount: problemType === 'industry_challenge' && rewardAmount ? Number(rewardAmount) : null,
      milestones: Number(milestones),
      deadline,
      judging_deadline: judgingDeadline,
      context: context.trim(),
      problem_stmt: problemStmt.trim(),
      scope: scope.trim(),
      constraints: constraints.trim(),
      deliverables: deliverables.trim(),
    }

    const res = await fetch('/api/problems/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = `Request failed (${res.status}).`
      if (text) {
        try {
          const data = JSON.parse(text)
          message = data?.error ?? message
        } catch {
          message = text
        }
      }
      if (message.includes('min_deadline')) {
        message = 'Submission deadline is too soon. Please choose a later date.'
      }
      console.error('Problem submission failed:', message)
      setError(message)
      setLoading(false)
      return
    }

    setSuccess('Problem posted successfully. You can track it from your dashboard.')
    setShowPopup(true)
    setLoading(false)
    setTimeout(() => router.push('/poster/dashboard'), 1200)
  }

  return (
    <div className="sn-page">
      <PosterHeader currentPath="/poster/post-problem" posterName={posterName} />

      {showPopup ? (
        <div className="sn-modal-backdrop">
          <div className="sn-modal-card sn-stack-md">
            <div className="sn-section-label">Upload complete</div>
            <h2 className="sn-card-title">Problem posted.</h2>
            <p className="sn-card-copy">Your problem is now live in the marketplace. Redirecting to your dashboard.</p>
            <div className="sn-cta-row" style={{ marginTop: 4 }}>
              <button type="button" onClick={() => setShowPopup(false)} className="sn-btn sn-btn-primary">
                Okay
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="sn-section">
        <div className="sn-container sn-side-layout">
          <div className="sn-stack-lg">
            <SectionIntro
              label="Poster workspace"
              title={
                <>
                  Post a new <em>problem.</em>
                </>
              }
              copy="Give students enough context to build serious, structured solutions."
            />

            <form onSubmit={handleSubmit} className="sn-card sn-stack-md">
              {error ? <div className="sn-alert">{error}</div> : null}
              {success ? <div className="sn-alert-success">{success}</div> : null}

              <Field label="Problem title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Short, descriptive title"
                  className="sn-input"
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <Field label="Domain">
                  <select value={domain} onChange={(e) => setDomain(e.target.value)} className="sn-select">
                    {DOMAINS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Problem type">
                  <select value={problemType} onChange={(e) => setProblemType(e.target.value)} className="sn-select">
                    {PROBLEM_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {problemType === 'industry_challenge' ? (
                <Field label="Reward amount (INR)">
                  <input
                    type="number"
                    min="0"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="50000"
                    className="sn-input"
                  />
                </Field>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Field label="Milestones">
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={milestones}
                    onChange={(e) => setMilestones(e.target.value)}
                    className="sn-input"
                  />
                </Field>

                <Field label="Submission deadline">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="sn-input"
                  />
                </Field>

                <Field label="Judging deadline">
                  <input
                    type="date"
                    value={judgingDeadline}
                    onChange={(e) => setJudgingDeadline(e.target.value)}
                    required
                    className="sn-input"
                  />
                </Field>
              </div>

              <Field label="Background & context">
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  required
                  rows={4}
                  placeholder="Why this problem matters, who is affected, and what has been tried."
                  className="sn-textarea"
                />
              </Field>

              <Field label="Problem statement">
                <textarea
                  value={problemStmt}
                  onChange={(e) => setProblemStmt(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the exact problem to be solved."
                  className="sn-textarea"
                />
              </Field>

              <Field label="Scope">
                <textarea
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  required
                  rows={3}
                  placeholder="What is in scope and what is out of scope?"
                  className="sn-textarea"
                />
              </Field>

              <Field label="Constraints">
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  required
                  rows={3}
                  placeholder="Budget, policy, infrastructure, or operational constraints."
                  className="sn-textarea"
                />
              </Field>

              <Field label="Deliverables">
                <textarea
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  required
                  rows={3}
                  placeholder="Expected outputs, format, or artifacts."
                  className="sn-textarea"
                />
              </Field>

              <div className="sn-cta-row" style={{ marginTop: 4, justifyContent: 'flex-end' }}>
                <Link href="/poster/dashboard" className="sn-btn sn-btn-light">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="sn-btn sn-btn-primary"
                  style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Submitting...' : 'Submit for review'}
                </button>
              </div>
            </form>
          </div>

          <aside className="sn-sidebar-card sn-stack-md">
            <div className="sn-section-label">Brief checklist</div>
            <h2 className="sn-card-title">What students need to see immediately.</h2>
            <ul className="sn-list">
              <li>Why the problem matters and who it affects.</li>
              <li>The exact scope of the challenge and what is out of scope.</li>
              <li>Clear constraints and the deliverables you expect back.</li>
            </ul>
            <div className="sn-surface sn-stack-sm">
              <div className="sn-section-label">Before you publish</div>
              <p className="sn-card-copy">Keep the judging deadline after the submission deadline, and use milestones to pace serious work.</p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="sn-field">
      <span className="sn-label">{label}</span>
      {children}
    </label>
  )
}
