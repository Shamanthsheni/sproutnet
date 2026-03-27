import Link from 'next/link'
import { SectionIntro, SiteFooter, SiteHeader } from '@/app/ui/site-shell'

const PROCESS = [
  {
    number: '01',
    title: 'Explore the marketplace',
    copy: 'Browse live challenges with clear metadata, context, deadlines, and milestones before you decide where to commit.',
  },
  {
    number: '02',
    title: 'Enroll and prepare',
    copy: 'Joining a challenge makes the commitment explicit and opens the path toward milestone-based work.',
  },
  {
    number: '03',
    title: 'Submit with structure',
    copy: 'Every serious solution follows the same framework so posters can compare work on substance instead of presentation tricks.',
  },
  {
    number: '04',
    title: 'Get judged and ranked',
    copy: 'Submissions are reviewed blind and turned into visible Builder Score movement on the leaderboard.',
  },
]

const FRAMEWORK = [
  'Problem Understanding',
  'Root Cause Analysis',
  'Proposed Solution',
  'Feasibility Assessment',
  'Expected Impact',
  'Risks and Limitations',
  'Implementation Plan',
]

const FAQS = [
  {
    question: 'Do I need to know how to code?',
    answer: 'No. Some problems may be technical, but the platform is built around structured thinking, not only software implementation.',
  },
  {
    question: 'Can organisations post challenges?',
    answer: 'Yes. Posters can create problem briefs, manage open challenges, and review student submissions through the poster-side workflow.',
  },
  {
    question: 'How are submissions judged?',
    answer: 'Review stays blind. The evaluator sees the work and scores it on clarity, depth, feasibility, impact, and implementation quality.',
  },
  {
    question: 'What does the leaderboard represent?',
    answer: 'It reflects Builder Score and sustained challenge performance, so ranking movement comes from consistent, judged work over time.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="sn-page">
      <SiteHeader
        currentPath="/how-it-works"
        actions={[
          { href: '/problems', label: 'View Live Challenges', tone: 'secondary' },
          { href: '/login/student', label: 'Solver Log in', tone: 'primary' },
        ]}
      />

      <section className="sn-hero">
        <div className="sn-container sn-hero-grid">
          <div className="sn-stack-lg sn-fade-up">
            <span className="sn-eyebrow">
              <span className="sn-eyebrow-dot" />
              Challenge workflow
            </span>
            <div className="sn-stack-sm">
              <h1 className="sn-hero-title">
                A simple path from
                <br />
                marketplace to <span className="sn-highlight">submission.</span>
              </h1>
              <p className="sn-hero-copy">
                SproutNet is designed to feel clear at every step: explore a challenge, commit to it, build with structure, and earn visible results through judged work.
              </p>
            </div>
          </div>

          <aside className="sn-hero-panel sn-fade-up sn-fade-up-delay-1">
            <div className="sn-panel-label">At a glance</div>
            <h2 className="sn-panel-title">The workflow is easy to read before it is easy to finish.</h2>
            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>4 clear steps</strong>
                <span>From browsing to leaderboard movement.</span>
              </div>
              <div className="sn-panel-item">
                <strong>7 required fields</strong>
                <span>Every final submission uses the same structure.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Blind review</strong>
                <span>Evaluation stays focused on the work itself.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            label="The process"
            title={
              <>
                How solvers move
                <br />
                through a challenge.
              </>
            }
            copy="The interface now presents the journey more clearly, but the flow itself remains disciplined and consistent across every live brief."
          />

          <div className="sn-grid-2">
            {PROCESS.map((step) => (
              <article key={step.number} className="sn-card sn-stack-sm">
                <span className="sn-pill sn-pill-brand" style={{ width: 'fit-content' }}>{step.number}</span>
                <h3 className="sn-card-title">{step.title}</h3>
                <p className="sn-card-copy">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-grid-2">
          <div className="sn-card sn-stack-md">
            <SectionIntro
              label="Submission framework"
              title={
                <>
                  Every challenge asks for
                  <br />
                  complete thinking.
                </>
              }
              copy="The seven-field framework makes the expectations visible for both solvers and posters."
            />
            <div className="sn-grid-2">
              {FRAMEWORK.map((field) => (
                <div key={field} className="sn-surface">
                  <strong>{field}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="sn-card sn-stack-md">
            <SectionIntro
              label="FAQ"
              title={
                <>
                  Common questions
                  <br />
                  about the process.
                </>
              }
            />
            {FAQS.map((item) => (
              <details key={item.question} className="sn-surface">
                <summary className="sn-card-title" style={{ cursor: 'pointer' }}>
                  {item.question}
                </summary>
                <p className="sn-card-copy" style={{ marginTop: 12 }}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="sn-section sn-section-dark">
        <div className="sn-container sn-center sn-stack-md">
          <SectionIntro
            dark
            center
            label="Next step"
            title={
              <>
                Ready to explore
                <br />
                live challenges?
              </>
            }
            copy="The marketplace is open. The workflow is clear. The only thing left is to start."
          />
          <div className="sn-cta-row" style={{ justifyContent: 'center' }}>
            <Link href="/problems" className="sn-btn sn-btn-light">
              View live challenges
            </Link>
            <Link href="/login/student" className="sn-btn sn-btn-primary">
              Start solving
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
