import { SectionIntro, SiteFooter, SiteHeader } from '@/app/ui/site-shell'
import FaqAccordion from './faq-accordion'

const PROCESS = [
  {
    number: '01',
    title: 'Browse open problems',
    copy:
      'Every problem on SproutNet is real. Posted by NGOs, companies, government bodies, or individuals with genuine challenges they need solved.',
  },
  {
    number: '02',
    title: 'Submit milestone by milestone',
    copy:
      'You do not submit once at the end. Milestone 1 checks your understanding and Milestone 2 asks for the full seven-field submission.',
  },
  {
    number: '03',
    title: 'Get evaluated fairly',
    copy:
      'All submissions are judged blind. Evaluators do not see your name, college, or year. They see only your thinking and score it against the rubric.',
  },
  {
    number: '04',
    title: 'Build your Builder Score',
    copy:
      'Your Builder Score grows with every strong submission, every milestone completed, and every challenge you take seriously.',
  },
]

const FRAMEWORK = [
  {
    number: '01',
    title: 'Problem Understanding',
    copy:
      'Restate the problem in your own words. What is actually happening, who is affected, and why is it worth solving?',
  },
  {
    number: '02',
    title: 'Root Cause Analysis',
    copy:
      'Go beyond symptoms. Use structured reasoning to identify what is actually causing the problem.',
  },
  {
    number: '03',
    title: 'Proposed Solution',
    copy:
      'Describe exactly what you are proposing, for whom, and how it works. Specificity matters.',
  },
  {
    number: '04',
    title: 'Feasibility Assessment',
    copy:
      'Can this actually be built? With what resources, by whom, and within what constraints?',
  },
  {
    number: '05',
    title: 'Expected Impact',
    copy:
      'If this works, what changes? Who benefits, by how much, and how will success be measured?',
  },
  {
    number: '06',
    title: 'Risks and Limitations',
    copy:
      'What could go wrong? What assumptions are you making? Strong solutions acknowledge their own weaknesses.',
  },
  {
    number: '07',
    title: 'Implementation Plan',
    copy:
      'How does this actually get built and deployed? This is where an idea becomes an executable plan.',
  },
]

const SCORING = [
  {
    title: 'Clarity of Thinking',
    copy:
      'Is the submission easy to follow? Are ideas expressed precisely and without ambiguity?',
  },
  {
    title: 'Root Cause Depth',
    copy:
      'Did the submission go beyond symptoms to identify the actual cause of the problem?',
  },
  {
    title: 'Solution Feasibility',
    copy:
      'Does the proposed solution account for technical, financial, and operational constraints?',
  },
  {
    title: 'Impact Potential',
    copy:
      'If implemented, how meaningful is the outcome and are the assumptions reasonable?',
  },
  {
    title: 'Implementation Depth',
    copy:
      'Does the submission explain how the work would actually be executed instead of stopping at the idea?',
  },
]

const ELIGIBILITY = [
  {
    title: 'Students',
    copy:
      'Phase 1 is open to students of Jyothy Institute of Technology. No branch restriction. No year restriction. No prior experience required.',
  },
  {
    title: 'Problem Posters',
    copy:
      'Organisations, NGOs, companies, research institutions, and individuals can post problems for students to solve.',
  },
  {
    title: 'Phase 2 and Beyond',
    copy:
      'Phase 2 will open the network to additional colleges across Karnataka and beyond.',
  },
]

const RECOGNITION = [
  {
    title: 'The Leaderboard',
    copy:
      'Rankings update after each judging cycle. The leaderboard shows Builder Score, submissions, problems attempted, and milestone depth.',
  },
  {
    title: 'Badges',
    copy:
      'Badges reward meaningful platform milestones like first submissions, consistency, and multi-domain work.',
  },
  {
    title: 'Your Public Profile',
    copy:
      'Every builder gets a public profile that shows their Builder Score, submission history, badges, and domain strengths.',
  },
]

const FAQS = [
  {
    question: 'Do I need to know how to code?',
    answer:
      'No. SproutNet is about structured thinking, not only technical implementation. Problems span multiple domains.',
  },
  {
    question: 'Can I work in a team?',
    answer:
      'Phase 1 submissions are individual. Team submissions are planned for later phases.',
  },
  {
    question: 'How long do I have to submit?',
    answer:
      'Each problem has its own deadline. Milestone 1 must be completed before Milestone 2 can be finalized.',
  },
  {
    question: 'What happens after I submit?',
    answer:
      'Your submission enters the judging queue. Scores and feedback are published after the judging cycle closes.',
  },
  {
    question: 'Can I see other submissions?',
    answer:
      'Submissions remain private during the active judging period. Selected top solutions may be published later with permission.',
  },
  {
    question: 'Is this free?',
    answer: 'Yes. SproutNet is free for students.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="sn-page">
      <SiteHeader
        currentPath="/how-it-works"
        actions={[
          { href: '/login/student', label: 'Solver Log in', tone: 'primary' },
        ]}
      />

      <section className="sn-hero">
        <div className="sn-container sn-hero-grid">
          <div className="sn-stack-lg">
            <span className="sn-eyebrow">
              <span className="sn-eyebrow-dot" />
              How it works
            </span>
            <div className="sn-stack-sm">
              <h1 className="sn-hero-title">
                Thinking is the skill.
                <br />
                Structure is the <span className="sn-highlight">proof.</span>
              </h1>
              <p className="sn-hero-copy">
                SproutNet is not just a list of challenges. It is a structured process from signup to scoring, designed to make serious thinking visible.
              </p>
            </div>
          </div>

          <aside className="sn-hero-panel">
            <div className="sn-panel-label">At a glance</div>
            <h2 className="sn-panel-title">A platform built around rigor, not guesswork.</h2>
            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>4 steps</strong>
                <span>From browsing a problem to earning visible builder proof.</span>
              </div>
              <div className="sn-panel-item">
                <strong>7 fields</strong>
                <span>Every full submission follows the same structure.</span>
              </div>
              <div className="sn-panel-item">
                <strong>5 criteria</strong>
                <span>Every judged submission is scored against a clear rubric.</span>
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
                Four steps.
                <br />
                No shortcuts.
              </>
            }
            copy="Every builder goes through the same process. No special tracks, no exceptions."
          />

          <div className="sn-grid-2">
            {PROCESS.map((step) => (
              <article key={step.number} className="sn-card sn-stack-sm">
                <span className="sn-pill sn-pill-brand" style={{ width: 'fit-content' }}>
                  {step.number}
                </span>
                <h3 className="sn-card-title">{step.title}</h3>
                <p className="sn-card-copy">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            label="The 7-field framework"
            title={
              <>
                Every serious solution
                <br />
                needs complete thinking.
              </>
            }
            copy="The framework exists to separate a real solution from a vague idea."
          />

          <div className="sn-grid-2">
            {FRAMEWORK.map((field) => (
              <article key={field.number} className="sn-card sn-stack-sm">
                <span className="sn-pill sn-pill-light" style={{ width: 'fit-content' }}>
                  Field {field.number}
                </span>
                <h3 className="sn-card-title">{field.title}</h3>
                <p className="sn-card-copy">{field.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            label="Scoring"
            title={
              <>
                Blind judging.
                <br />
                Five criteria.
              </>
            }
            copy="The evaluator sees only your work. Every score comes from a consistent review structure."
          />

          <div className="sn-grid-3">
            {SCORING.map((item) => (
              <article key={item.title} className="sn-card sn-stack-sm">
                <h3 className="sn-card-title">{item.title}</h3>
                <p className="sn-card-copy">{item.copy}</p>
              </article>
            ))}
          </div>

          <div className="sn-card sn-stack-sm">
            <div className="sn-section-label">Builder score</div>
            <p className="sn-card-copy">
              Your Builder Score reflects judged performance and consistency across challenges. It rewards both quality and seriousness over time.
            </p>
          </div>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-grid-3">
          {ELIGIBILITY.map((item) => (
            <article key={item.title} className="sn-card sn-stack-sm">
              <div className="sn-section-label">Eligibility</div>
              <h3 className="sn-card-title">{item.title}</h3>
              <p className="sn-card-copy">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            label="Leaderboard and recognition"
            title={
              <>
                Your thinking,
                <br />
                publicly ranked.
              </>
            }
            copy="Every submission contributes to your builder identity on the platform."
          />

          <div className="sn-grid-3">
            {RECOGNITION.map((item) => (
              <article key={item.title} className="sn-card sn-stack-sm">
                <h3 className="sn-card-title">{item.title}</h3>
                <p className="sn-card-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container">
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
            <FaqAccordion items={FAQS} />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
