import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SectionIntro, SiteFooter, SiteHeader } from '@/app/ui/site-shell'

export default async function LandingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: featuredProblems } = await supabase
    .from('problems')
    .select('id, title, domain, problem_type, context')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="sn-page">
      <SiteHeader
        currentPath="/"
        actions={[
          ...(user ? [] : [{ href: '/login', label: 'Solver Log in', tone: 'primary' as const }]),
          { href: user ? '/dashboard' : '/login/student', label: user ? 'Open Dashboard' : 'Start Solving', tone: 'secondary' as const },
        ]}
      />

      <section className="sn-hero">
        <div className="sn-container sn-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div className="sn-stack-lg">
            <span className="sn-eyebrow">
              <span className="sn-eyebrow-dot" />
              SproutNet for serious problem solvers
            </span>

            <div className="sn-stack-sm">
              <h1 className="sn-hero-title sn-hero-title-animated">
                <span className="sn-hero-line">
                  <span className="sn-hero-word sn-hero-word-1">We</span>{' '}
                  <span className="sn-highlight sn-highlight-hero sn-hero-word sn-hero-word-2">Accelerate</span>
                </span>
                <span className="sn-hero-line">
                  <span className="sn-hero-word sn-hero-word-3">structured</span>
                </span>
                <span className="sn-hero-line">
                  <span className="sn-hero-word sn-hero-word-4">problem</span>{' '}
                  <span className="sn-hero-word sn-hero-word-5">solving.</span>
                </span>
              </h1>
              <p className="sn-hero-copy">
                Explore real problems, submit serious solutions, and build public credibility through a challenge marketplace designed for students, organisations, and universities.
              </p>
            </div>

            <div className="sn-cta-row">
              <Link href={user ? '/dashboard' : '/login/student'} className="sn-btn sn-btn-primary">
                {user ? 'Open your dashboard' : 'Start solving'}
              </Link>
              <Link href="/problems" className="sn-btn sn-btn-secondary">
                Explore the marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-grid-2">
          <article className="sn-card sn-stack-md" style={{ position: 'relative' }}>
            <div className="sn-section-label" style={{ color: '#ffffff', background: 'linear-gradient(135deg, var(--sn-brand) 0, var(--sn-accent) 100%)', padding: '14px 18px', borderRadius: '16px 16px 0 0', margin: '-28px -28px 6px' }}>
              SproutNet for individual solvers
            </div>
            <h2 className="sn-card-title" style={{ fontSize: 56, lineHeight: 0.98 }}>
              Explore real problems.
              <br />
              Change them today.
            </h2>
            <p className="sn-card-copy" style={{ fontSize: 18 }}>
              Browse challenge briefs, enroll in the ones that matter, and build a visible record of disciplined thinking.
            </p>
            <div className="sn-cta-row">
              <Link href="/login/student" className="sn-btn sn-btn-primary">
                Start solving
              </Link>
            </div>
          </article>

          <article className="sn-card sn-stack-md" style={{ position: 'relative' }}>
            <div className="sn-section-label" style={{ color: '#ffffff', background: 'linear-gradient(135deg, var(--sn-brand) 0, var(--sn-accent) 100%)', padding: '14px 18px', borderRadius: '16px 16px 0 0', margin: '-28px -28px 6px' }}>
              SproutNet for companies and universities
            </div>
            <h2 className="sn-card-title" style={{ fontSize: 56, lineHeight: 0.98 }}>
              Get discovered by
              <br />
              sharper builders.
            </h2>
            <p className="sn-card-copy" style={{ fontSize: 18 }}>
              Post challenges with real context, receive structured submissions, and manage the full pipeline through a cleaner poster experience.
            </p>
            <div className="sn-cta-row">
              <Link href="/login/poster" className="sn-btn sn-btn-primary">
                Find out more
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            center
            label="Live challenges"
            title={<>Live Challenges</>}
            copy="A cleaner marketplace surface for real briefs across public impact and industry lanes."
          />

          <div className="sn-grid-3">
            {(featuredProblems ?? []).map((problem) => (
              <Link key={problem.id} href={`/problems/${problem.id}`} style={{ textDecoration: 'none' }}>
                <article className="sn-card sn-stack-md">
                  <div className="sn-market-visual" style={{ height: 240 }} />
                  <div className="sn-badge-row" style={{ marginTop: 0 }}>
                    <span className="sn-pill sn-pill-brand">{problem.domain}</span>
                    <span className={problem.problem_type === 'industry_challenge' ? 'sn-pill sn-pill-accent' : 'sn-pill sn-pill-light'}>
                      {problem.problem_type === 'industry_challenge' ? 'Industry challenge' : 'Public impact'}
                    </span>
                  </div>
                  <h3 className="sn-card-title">{problem.title}</h3>
                  <p className="sn-card-copy">
                    {problem.context.length > 150 ? `${problem.context.slice(0, 150)}...` : problem.context}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sn-section sn-section-dark">
        <div className="sn-container sn-grid-3">
          <article className="sn-card sn-stack-sm" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)' }}>
            <div className="sn-section-label" style={{ color: '#ffffff' }}>Marketplace</div>
            <h3 className="sn-card-title sn-card-title-dark">Browse vetted briefs</h3>
            <p className="sn-card-copy sn-card-copy-dark">Students start with clearer discovery: domains, deadlines, milestones, and problem context are visible early.</p>
          </article>
          <article className="sn-card sn-stack-sm" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)' }}>
            <div className="sn-section-label" style={{ color: '#ffffff' }}>Framework</div>
            <h3 className="sn-card-title sn-card-title-dark">Submit with structure</h3>
            <p className="sn-card-copy sn-card-copy-dark">The seven-field system makes strong thinking easier to recognize and weak thinking harder to hide.</p>
          </article>
          <article className="sn-card sn-stack-sm" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)' }}>
            <div className="sn-section-label" style={{ color: '#ffffff' }}>Community</div>
            <h3 className="sn-card-title sn-card-title-dark">Build visible credibility</h3>
            <p className="sn-card-copy sn-card-copy-dark">Leaderboard movement, solved challenges, and public profiles become proof that travels with you.</p>
          </article>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
