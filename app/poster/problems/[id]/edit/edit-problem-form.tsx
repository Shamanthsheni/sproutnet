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

type Problem = {
  id: string
  title: string
  domain: string
  problem_type: string
  reward_amount: number | null
  milestones: number
  deadline: string
  judging_deadline: string
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
  status: string
}

export default function EditProblemForm({ posterName, problem }: { posterName: string; problem: Problem }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPopup, setShowPopup] = useState(false)

  const [title, setTitle] = useState(problem.title)
  const [domain, setDomain] = useState(problem.domain)
  const [problemType, setProblemType] = useState(problem.problem_type)
  const [rewardAmount, setRewardAmount] = useState(problem.reward_amount ? String(problem.reward_amount) : '')
  const [milestones, setMilestones] = useState(String(problem.milestones))
  const [deadline, setDeadline] = useState(problem.deadline)
  const [judgingDeadline, setJudgingDeadline] = useState(problem.judging_deadline)
  const [context, setContext] = useState(problem.context)
  const [problemStmt, setProblemStmt] = useState(problem.problem_stmt)
  const [scope, setScope] = useState(problem.scope)
  const [constraints, setConstraints] = useState(problem.constraints)
  const [deliverables, setDeliverables] = useState(problem.deliverables)

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
      id: problem.id,
      title: title.trim(),
      domain,
      problem_type: problemType,
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

    const res = await fetch('/api/problems/update', {
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
      setError(message)
      setLoading(false)
      return
    }

    setSuccess('Problem updated.')
    setShowPopup(true)
    setLoading(false)
    setTimeout(() => router.push('/poster/problems'), 800)
  }

  return (
    <div className="sn-page">
      <PosterHeader currentPath={`/poster/problems/${problem.id}/edit`} posterName={posterName} />

      {showPopup ? (
        <div className="sn-modal-backdrop">
          <div className="sn-modal-card sn-stack-md">
            <div className="sn-section-label">Updated</div>
            <h2 className="sn-card-title">Problem updated.</h2>
            <p className="sn-card-copy">Your changes are saved. Redirecting to your problems list.</p>
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
              label="Problem editor"
              title={
                <>
                  Refine this <em>problem.</em>
                </>
              }
              copy="Update the challenge details students use to understand scope, constraints, and expected deliverables."
            />

            <form onSubmit={handleSubmit} className="sn-card sn-stack-md">
              {error ? <div className="sn-alert">{error}</div> : null}
              {success ? <div className="sn-alert-success">{success}</div> : null}

              <Field label="Problem title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} required className="sn-input" />
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
                <textarea value={context} onChange={(e) => setContext(e.target.value)} required rows={4} className="sn-textarea" />
              </Field>

              <Field label="Problem statement">
                <textarea value={problemStmt} onChange={(e) => setProblemStmt(e.target.value)} required rows={4} className="sn-textarea" />
              </Field>

              <Field label="Scope">
                <textarea value={scope} onChange={(e) => setScope(e.target.value)} required rows={3} className="sn-textarea" />
              </Field>

              <Field label="Constraints">
                <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} required rows={3} className="sn-textarea" />
              </Field>

              <Field label="Deliverables">
                <textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} required rows={3} className="sn-textarea" />
              </Field>

              <div className="sn-cta-row" style={{ marginTop: 4, justifyContent: 'flex-end' }}>
                <Link href="/poster/problems" className="sn-btn sn-btn-light">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="sn-btn sn-btn-primary"
                  style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          <aside className="sn-sidebar-card sn-stack-md">
            <div className="sn-section-label">Revision checklist</div>
            <h2 className="sn-card-title">Keep the brief clear as it evolves.</h2>
            <ul className="sn-list">
              <li>Update context when the challenge conditions change.</li>
              <li>Keep scope and constraints precise so students do not guess.</li>
              <li>Review deadlines before republishing a held brief.</li>
            </ul>
            <div className="sn-surface sn-stack-sm">
              <div className="sn-section-label">Status reminder</div>
              <p className="sn-card-copy">You can save changes here and then switch the brief between live and on hold from the problems list.</p>
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
