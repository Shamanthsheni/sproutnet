import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SiteFooter } from '@/app/ui/site-shell'
import { createClient } from '@/lib/supabase/server'
import { PosterHeader } from '@/app/poster/ui/poster-shell'

export default async function PosterDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/poster')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  if (!profile) redirect('/login/poster')
  if (profile.role === 'student') redirect('/dashboard')
  if (profile.role === 'admin') redirect('/dashboard')

  const quickActions = [
    {
      href: '/poster/post-problem',
      label: 'Post a problem',
      copy: 'Create a structured brief that gives students the right context from the first read.',
    },
    {
      href: '/poster/problems',
      label: 'Manage my problems',
      copy: 'Edit challenge details, move briefs on hold, and track who is enrolled.',
    },
    {
      href: '/poster/solutions',
      label: 'Review student solutions',
      copy: 'See the submissions attached to your challenges in one cleaner workspace.',
    },
  ]

  return (
    <div className="sn-page">
      <PosterHeader currentPath="/poster/dashboard" posterName={profile.name} />

      <section className="sn-hero">
        <div className="sn-container sn-hero-grid">
          <div className="sn-stack-lg">
            <div className="sn-fade-up">
              <span className="sn-eyebrow">
                <span className="sn-eyebrow-dot" />
                Poster workspace
              </span>
              <h1 className="sn-hero-title">
                Welcome back,
                <br />
                {profile.name.split(' ')[0]}.
              </h1>
              <p className="sn-hero-copy">
                Post new problems, manage challenge status, and review structured student submissions from the same workspace.
              </p>
            </div>

            <div className="sn-grid-3 sn-fade-up sn-fade-up-delay-1">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <article className="sn-card sn-stack-sm">
                    <div className="sn-section-label">Next action</div>
                    <h2 className="sn-card-title">{action.label}</h2>
                    <p className="sn-card-copy">{action.copy}</p>
                  </article>
                </Link>
              ))}
            </div>
          </div>

          <aside className="sn-hero-panel sn-fade-up sn-fade-up-delay-2">
            <div className="sn-panel-label">Poster flow</div>
            <h2 className="sn-panel-title">Keep the full challenge pipeline visible.</h2>
            <p className="sn-panel-copy">
              The poster area now uses the same marketplace language as the public site, so creating briefs and reviewing work feels like part of one system.
            </p>
            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>Publish clearer briefs</strong>
                <span>Lead with stronger context, scope, constraints, and deliverables.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Track activity faster</strong>
                <span>Move between your problems, enrollments, and solutions without losing context.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Review serious work</strong>
                <span>Every student submission still follows the same structured framework.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
