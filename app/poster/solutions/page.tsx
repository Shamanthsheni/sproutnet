import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SectionIntro, SiteFooter } from '@/app/ui/site-shell'
import { createClient } from '@/lib/supabase/server'
import { PosterHeader } from '@/app/poster/ui/poster-shell'

type SubmissionRow = {
  id: string
  stage: string
  milestone: number
  status: string
  created_at: string
  problem_id: string
  student_id: string
  problems?: { title: string; domain: string } | null
  users?: { name: string; dept: string; year: string } | null
}

function formatStage(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function PosterSolutionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/poster')

  const { data: profile } = await supabase.from('users').select('role, name').eq('id', user.id).single()

  if (!profile) redirect('/login/poster')
  if (profile.role !== 'poster') redirect('/dashboard')

  const { data: problems } = await supabase.from('problems').select('id, title, domain').eq('poster_id', user.id)

  const problemIds = (problems ?? []).map((problem) => problem.id)

  let submissions: SubmissionRow[] = []
  if (problemIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, stage, milestone, status, created_at, problem_id, student_id, problems(title, domain), users(name, dept, year)')
      .in('problem_id', problemIds)
      .order('created_at', { ascending: false })

    submissions = (data ?? []) as unknown as SubmissionRow[]
  }

  return (
    <div className="sn-page">
      <PosterHeader currentPath="/poster/solutions" posterName={profile.name} />

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <div className="sn-fade-up">
            <SectionIntro
              label="Student solutions"
              title={
                <>
                  Review incoming <em>submissions.</em>
                </>
              }
              copy="Solutions submitted against your challenges appear here, grouped inside the same cleaner poster workspace."
            />
          </div>

          {submissions.length === 0 ? (
            <div className="sn-empty sn-stack-sm sn-fade-up sn-fade-up-delay-1">
              <div className="sn-section-label">No submissions yet</div>
              <h3 className="sn-card-title">Your solution inbox is empty.</h3>
              <p className="sn-card-copy">Once students submit work against your problems, the latest entries will appear here.</p>
              <div className="sn-cta-row" style={{ marginTop: 4, justifyContent: 'center' }}>
                <Link href="/poster/problems" className="sn-btn sn-btn-light">
                  View my problems
                </Link>
                <Link href="/poster/post-problem" className="sn-btn sn-btn-primary">
                  Post a new problem
                </Link>
              </div>
            </div>
          ) : (
            <div className="sn-grid-3 sn-fade-up sn-fade-up-delay-1">
              {submissions.map((submission) => (
                <article key={submission.id} className="sn-card sn-stack-md">
                  <div className="sn-badge-row" style={{ marginTop: 0 }}>
                    <span className="sn-pill sn-pill-brand">{submission.problems?.domain ?? 'Problem'}</span>
                    <span className="sn-pill sn-pill-light">{submission.status ?? 'pending'}</span>
                  </div>

                  <div className="sn-stack-sm">
                    <span className="sn-meta">
                      {new Date(submission.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <h3 className="sn-card-title">{submission.problems?.title ?? 'Problem'}</h3>
                    <p className="sn-card-copy">
                      Milestone {submission.milestone} · {formatStage(submission.stage)}
                    </p>
                  </div>

                  <div className="sn-surface sn-stack-sm">
                    <span className="sn-section-label">Submitted by</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        className="sn-avatar"
                        style={{ background: 'linear-gradient(135deg, var(--sn-brand), var(--sn-brand-dark))' }}
                      >
                        {submission.users?.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="sn-stack-sm" style={{ gap: 4 }}>
                        <strong className="sn-inline-heading" style={{ fontSize: 16 }}>
                          {submission.users?.name ?? 'Student'}
                        </strong>
                        <span className="sn-card-copy">
                          {(submission.users?.dept ?? 'Department')} · {(submission.users?.year ?? 'Year')}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
