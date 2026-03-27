'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteFooter, SiteHeader } from '@/app/ui/site-shell'

type Problem = {
  id: string
  title: string
  domain: string
  problem_type: string
  status: string
  reward_amount: number | null
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
  milestones: number
  deadline: string
  judging_deadline: string
  submission_count: number
  judge_type: string
  poster_id: string
}

type Comment = {
  id: string
  body: string
  created_at: string
  author_id: string
  parent_id: string | null
  users: { name: string; role: string } | null
}

type User = {
  id: string
  role: string
  name: string
}

const SECTIONS = [
  { key: 'context' as const, label: 'Background' },
  { key: 'problem_stmt' as const, label: 'Problem' },
  { key: 'scope' as const, label: 'Scope' },
  { key: 'constraints' as const, label: 'Constraints' },
  { key: 'deliverables' as const, label: 'Deliverables' },
]

type SectionKey = (typeof SECTIONS)[number]['key']

export default function ProblemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [referenceTime] = useState(() => Date.now())

  const [problem, setProblem] = useState<Problem | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('context')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: prob } = await supabase.from('problems').select('*').eq('id', id).single()
      setProblem(prob)

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const { data: profile } = await supabase.from('users').select('id, role, name').eq('id', authUser.id).single()
        setUser(profile)

        if (profile?.role === 'student') {
          const { data: enroll } = await supabase
            .from('enrollments')
            .select('id')
            .eq('problem_id', id)
            .eq('student_id', authUser.id)
            .eq('status', 'active')
            .limit(1)

          setIsEnrolled((enroll?.length ?? 0) > 0)

          const { data: sub } = await supabase
            .from('submissions')
            .select('id')
            .eq('problem_id', id)
            .eq('student_id', authUser.id)
            .limit(1)

          setHasSubmitted((sub?.length ?? 0) > 0)
        }
      }

      const { data: disc } = await supabase
        .from('discussion')
        .select('id, body, created_at, author_id, parent_id, users(name, role)')
        .eq('problem_id', id)
        .order('created_at', { ascending: true })

      setComments((disc as unknown as Comment[]) ?? [])
      setLoading(false)
    }

    load()
  }, [id])

  async function postComment() {
    if (!commentBody.trim() || !user) return

    setPosting(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('discussion')
      .insert({ problem_id: id, author_id: user.id, body: commentBody.trim() })
      .select('id, body, created_at, author_id, parent_id, users(name, role)')
      .single()

    if (data) setComments((prev) => [...prev, data as unknown as Comment])

    setCommentBody('')
    setPosting(false)
  }

  async function enroll() {
    if (!user || user.role !== 'student') return

    setEnrolling(true)
    setEnrollError('')

    const res = await fetch('/api/enrollments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem_id: id }),
    })

    if (res.ok) {
      setIsEnrolled(true)
    } else {
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

      setEnrollError(message)
    }

    setEnrolling(false)
  }

  if (loading) {
    return (
      <div className="sn-page">
        <div className="sn-auth-shell">
          <div className="sn-empty">Loading challenge brief...</div>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="sn-page">
        <div className="sn-auth-shell">
          <div className="sn-empty sn-stack-sm">
            <h1 className="sn-card-title">Problem not found</h1>
            <Link href="/problems" className="sn-btn sn-btn-light">
              Back to problems
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isIndustry = problem.problem_type === 'industry_challenge'
  const daysLeft = Math.max(0, Math.ceil((new Date(problem.deadline).getTime() - referenceTime) / (1000 * 60 * 60 * 24)))
  const activeCopy = problem[activeSection]

  return (
    <div className="sn-page">
      <div className="sn-hero-band">
        <SiteHeader
          currentPath="/problems"
          actions={[
            { href: '/problems', label: 'All problems', tone: 'secondary' },
            { href: user ? '/dashboard' : '/login', label: user ? 'Dashboard' : 'Sign in', tone: 'primary' },
          ]}
        />

        <section className="sn-hero">
          <div className="sn-container sn-hero-grid">
            <div className="sn-stack-lg">
              <div className="sn-badge-row sn-fade-up">
                <span className="sn-pill sn-pill-dark">{problem.domain}</span>
                <span className="sn-pill sn-pill-dark">{isIndustry ? 'Industry challenge' : 'Public impact'}</span>
                <span className="sn-pill sn-pill-dark">Status: {problem.status}</span>
              </div>
              <div className="sn-fade-up sn-fade-up-delay-1">
                <h1 className="sn-hero-title">
                  {problem.title}
                </h1>
                <p className="sn-hero-copy">
                  Review the full brief, move through the section tabs, and decide whether this challenge is worth your time before you commit to solving it.
                </p>
              </div>
              <div className="sn-grid-3 sn-fade-up sn-fade-up-delay-2">
                <div className="sn-stat-card">
                  <div className="sn-stat-value">{daysLeft}d</div>
                  <div className="sn-stat-label">Remaining before the problem deadline</div>
                </div>
                <div className="sn-stat-card">
                  <div className="sn-stat-value">{problem.milestones}</div>
                  <div className="sn-stat-label">Milestones across the solving journey</div>
                </div>
                <div className="sn-stat-card">
                  <div className="sn-stat-value">{problem.submission_count}</div>
                  <div className="sn-stat-label">Submissions recorded so far</div>
                </div>
              </div>
            </div>

            <aside className="sn-hero-panel sn-fade-up sn-fade-up-delay-2">
              <div className="sn-panel-label">Challenge summary</div>
              <h2 className="sn-panel-title">Everything important is visible early.</h2>
              <p className="sn-panel-copy">
                Use the summary cards to understand challenge type, judging timing, and submission expectations before you move deeper into the brief.
              </p>
              <div className="sn-panel-list">
                <div className="sn-panel-item">
                  <strong>{isIndustry && problem.reward_amount ? `INR ${problem.reward_amount.toLocaleString('en-IN')}` : 'Public impact track'}</strong>
                  <span>{isIndustry ? 'Reward-backed challenge format.' : 'Impact-first challenge format.'}</span>
                </div>
                <div className="sn-panel-item">
                  <strong>Judging closes {new Date(problem.judging_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
                  <span>Review timing stays visible so students know when their work turns into scored proof.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <section className="sn-section sn-section-paper">
        <div className="sn-container sn-side-layout">
          <div className="sn-stack-lg">
            <div className="sn-surface" style={{ padding: 24 }}>
              <div className="sn-stack-md">
                <div className="sn-tabs">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      className={`sn-tab${activeSection === section.key ? ' is-active' : ''}`}
                      onClick={() => setActiveSection(section.key)}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>

                <div className="sn-stack-sm">
                  <div className="sn-section-label">
                    {SECTIONS.find((section) => section.key === activeSection)?.label}
                  </div>
                  <p className="sn-card-copy" style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>
                    {activeCopy}
                  </p>
                </div>
              </div>
            </div>

            <div className="sn-card sn-stack-md">
              <div className="sn-section-label">Milestones</div>
              <h2 className="sn-card-title">A visible solving arc from first understanding to final execution.</h2>
              <div className="sn-stack-sm">
                {Array.from({ length: problem.milestones }, (_, index) => (
                  <div key={`milestone-${index + 1}`} className="sn-surface" style={{ padding: 18 }}>
                    <div className="sn-split-line">
                      <strong>Milestone {index + 1}</strong>
                      <span className="sn-pill sn-pill-light">Structured submission</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sn-stack-sm">
              <div className="sn-split-line">
                <h2 className="sn-card-title">Discussion</h2>
                <span className="sn-pill sn-pill-light">{comments.length} comments</span>
              </div>

              {comments.length === 0 ? (
                <div className="sn-empty">
                  <p className="sn-card-copy">No comments yet. The discussion space is ready when someone has a real question to ask.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <article key={comment.id} className="sn-comment-card sn-stack-sm">
                    <div className="sn-split-line" style={{ justifyContent: 'flex-start' }}>
                      <div className="sn-avatar" style={{ background: '#12856F' }}>
                        {comment.users?.name?.slice(0, 1).toUpperCase() ?? '?'}
                      </div>
                      <div className="sn-stack-sm" style={{ gap: 2 }}>
                        <strong>{comment.users?.name ?? 'Unknown'}</strong>
                        <span className="sn-subtle">
                          {new Date(comment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <p className="sn-card-copy">{comment.body}</p>
                  </article>
                ))
              )}

              {user ? (
                <div className="sn-comment-card sn-stack-sm">
                  <label className="sn-label" htmlFor="discussion-body">
                    Add to the discussion
                  </label>
                  <textarea
                    id="discussion-body"
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="Ask a useful question or clarify a point in the brief."
                    className="sn-textarea"
                  />
                  <div className="sn-cta-row">
                    <button
                      type="button"
                      className="sn-btn sn-btn-light"
                      disabled={posting || !commentBody.trim()}
                      onClick={postComment}
                    >
                      {posting ? 'Posting...' : 'Post comment'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="sn-empty">
                  <Link href="/login" className="sn-btn sn-btn-light">
                    Sign in to join the discussion
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="sn-stack-md" style={{ position: 'sticky', top: 110 }}>
            <aside className="sn-sidebar-card sn-sidebar-card-dark sn-stack-md">
              <div className="sn-panel-label">Action</div>
              <h2 className="sn-card-title sn-card-title-dark">
                {hasSubmitted ? 'Continue your solution.' : isEnrolled ? 'Start your submission.' : 'Commit to this challenge.'}
              </h2>
              <p className="sn-card-copy sn-card-copy-dark">
                The CTA stays visible because the page should make the next move obvious without reducing the seriousness of the brief.
              </p>

              {user?.role === 'student' ? (
                isEnrolled ? (
                  <button type="button" className="sn-btn sn-btn-primary" onClick={() => router.push(`/problems/${problem.id}/submit`)}>
                    {hasSubmitted ? 'Continue solving' : 'Start solving'}
                  </button>
                ) : (
                  <>
                    <button type="button" className="sn-btn sn-btn-primary" disabled={enrolling} onClick={enroll}>
                      {enrolling ? 'Enrolling...' : 'Enroll to solve'}
                    </button>
                    {enrollError ? <div className="sn-alert">{enrollError}</div> : null}
                  </>
                )
              ) : user ? (
                <div className="sn-inline-chip">Only student accounts can submit solutions.</div>
              ) : (
                <Link href="/login" className="sn-btn sn-btn-primary">
                  Sign in to solve
                </Link>
              )}
            </aside>

            <aside className="sn-sidebar-card sn-stack-sm">
              <div className="sn-section-label">Marketplace metadata</div>
              <div className="sn-stack-sm">
                <div className="sn-split-line">
                  <span className="sn-subtle">Days left</span>
                  <strong>{daysLeft}d</strong>
                </div>
                <div className="sn-split-line">
                  <span className="sn-subtle">Milestones</span>
                  <strong>{problem.milestones}</strong>
                </div>
                <div className="sn-split-line">
                  <span className="sn-subtle">Submissions</span>
                  <strong>{problem.submission_count}</strong>
                </div>
                <div className="sn-split-line">
                  <span className="sn-subtle">Judging by</span>
                  <strong>{new Date(problem.judging_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
                </div>
              </div>
            </aside>

            <aside className="sn-sidebar-card sn-stack-sm">
              <div className="sn-section-label">Seven-field reminder</div>
              <ul className="sn-list">
                <li>Problem Understanding</li>
                <li>Root Cause Analysis</li>
                <li>Proposed Solution</li>
                <li>Feasibility Assessment</li>
                <li>Expected Impact</li>
                <li>Risks and Limitations</li>
                <li>Implementation Plan</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
