import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SectionIntro, SiteFooter, SiteHeader } from '@/app/ui/site-shell'

const DOMAINS = ['All', 'AI & Data', 'Climate', 'Public Infrastructure', 'Healthcare', 'Agriculture', 'Education', 'Urban Mobility', 'Civic Technology']

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'public_impact', label: 'Public Impact' },
  { value: 'industry_challenge', label: 'Industry Challenge' },
]

function filterClass(active: boolean) {
  return active ? 'sn-pill sn-pill-brand' : 'sn-pill sn-pill-light'
}

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; type?: string }>
}) {
  const params = await searchParams
  const selectedDomain = params.domain || 'All'
  const selectedType = params.type || 'all'

  const supabase = await createClient()

  let query = supabase
    .from('problems')
    .select('id, title, domain, problem_type, status, reward_amount, milestones, deadline, submission_count, context')
    .order('created_at', { ascending: false })
    .eq('status', 'open')

  if (selectedDomain !== 'All') query = query.eq('domain', selectedDomain)
  if (selectedType !== 'all') query = query.eq('problem_type', selectedType)

  const { data: problems } = await query
  const problemCount = problems?.length ?? 0

  return (
    <div className="sn-page">
      <SiteHeader
        currentPath="/problems"
        actions={[
          { href: '/login/poster', label: 'Post a Challenge', tone: 'secondary' },
          { href: '/login/student', label: 'Solver Log in', tone: 'primary' },
        ]}
      />

      <section className="sn-hero">
        <div className="sn-container sn-hero-grid">
          <div className="sn-stack-lg sn-fade-up">
            <span className="sn-eyebrow">
              <span className="sn-eyebrow-dot" />
              Live challenge marketplace
            </span>
            <div className="sn-stack-sm">
              <h1 className="sn-hero-title">Live Challenges</h1>
              <p className="sn-hero-copy">
                Explore open problem briefs across public impact and industry challenge tracks. Filter by domain, scan the cards, and open the brief that matches your strengths.
              </p>
            </div>
            <div className="sn-badge-row">
              <span className="sn-pill sn-pill-brand">{problemCount} open</span>
              <span className="sn-pill sn-pill-light">{selectedDomain === 'All' ? 'All domains' : selectedDomain}</span>
              <span className="sn-pill sn-pill-light">{TYPE_OPTIONS.find((item) => item.value === selectedType)?.label ?? 'All Types'}</span>
            </div>
          </div>

          <aside className="sn-hero-panel sn-fade-up sn-fade-up-delay-1">
            <div className="sn-panel-label">How to use this page</div>
            <h2 className="sn-panel-title">Filter quickly. Open only the briefs worth your time.</h2>
            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>Domain first</strong>
                <span>Start broad or narrow the marketplace to the sectors you care about most.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Track second</strong>
                <span>Switch between public impact and industry challenge to match your intent.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Brief depth next</strong>
                <span>Each card surfaces enough information to decide whether to open the full challenge.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            label="Filters"
            title={
              <>
                Shape the marketplace
                <br />
                around your search.
              </>
            }
          />

          <div className="sn-card sn-stack-sm">
            <div className="sn-section-label">Challenge Type</div>
            <div className="sn-badge-row">
              {TYPE_OPTIONS.map((type) => (
                <Link
                  key={type.value}
                  href={`/problems?domain=${encodeURIComponent(selectedDomain)}&type=${encodeURIComponent(type.value)}`}
                  className={filterClass(selectedType === type.value)}
                  style={{ textDecoration: 'none' }}
                >
                  {type.label}
                </Link>
              ))}
            </div>

            <div className="sn-section-label" style={{ marginTop: 6 }}>Domain</div>
            <div className="sn-badge-row">
              {DOMAINS.map((domain) => (
                <Link
                  key={domain}
                  href={`/problems?domain=${encodeURIComponent(domain)}&type=${encodeURIComponent(selectedType)}`}
                  className={filterClass(selectedDomain === domain)}
                  style={{ textDecoration: 'none' }}
                >
                  {domain}
                </Link>
              ))}
            </div>
          </div>

          {problemCount > 0 ? (
            <div className="sn-grid-3">
              {problems?.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          ) : (
            <div className="sn-empty">
              <h3 className="sn-card-title">No challenges match this filter.</h3>
              <p className="sn-card-copy" style={{ marginTop: 10 }}>
                Try another domain or track to widen the marketplace view.
              </p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

function ProblemCard({
  problem,
}: {
  problem: {
    id: string
    title: string
    domain: string
    problem_type: string
    status: string
    reward_amount: number | null
    milestones: number
    deadline: string
    submission_count: number
    context: string
  }
}) {
  const isIndustry = problem.problem_type === 'industry_challenge'
  const deadlineLabel = new Date(problem.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const contextSnippet = problem.context.length > 155 ? `${problem.context.slice(0, 155)}...` : problem.context

  return (
    <Link href={`/problems/${problem.id}`} className="sn-market-link">
      <article className="sn-card sn-stack-md sn-market-card">
        <div style={{ height: 220, borderRadius: 18, background: 'linear-gradient(135deg, var(--sn-brand-soft), #dff5e5)', border: '1px solid var(--sn-line)' }} />
        <div className="sn-badge-row" style={{ marginTop: 0 }}>
          <span className="sn-pill sn-pill-brand">{problem.domain}</span>
          <span className={isIndustry ? 'sn-pill sn-pill-accent' : 'sn-pill sn-pill-light'}>
            {isIndustry ? `Industry Challenge${problem.reward_amount ? ` - INR ${problem.reward_amount.toLocaleString('en-IN')}` : ''}` : 'Public Impact'}
          </span>
        </div>
        <h2 className="sn-card-title sn-market-title">{problem.title}</h2>
        <p className="sn-card-copy sn-market-copy">{contextSnippet}</p>
        <div className="sn-market-meta">
          <div>
            <strong>{deadlineLabel}</strong>
            <span>deadline</span>
          </div>
          <div>
            <strong>{problem.milestones}</strong>
            <span>milestones</span>
          </div>
          <div>
            <strong>{problem.submission_count}</strong>
            <span>submissions</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
