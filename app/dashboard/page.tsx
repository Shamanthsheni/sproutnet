import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SectionIntro, SiteFooter, SiteHeader } from '@/app/ui/site-shell'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  if (!profile) redirect('/login')
  if (profile.role === 'poster') redirect('/poster/dashboard')

  const isStudent = profile.role === 'student'

  const stats = isStudent
    ? [
        { label: 'Builder Score', value: profile.builder_score ?? 0 },
        { label: 'Problems attempted', value: profile.attempted ?? 0 },
        { label: 'Average score', value: profile.avg_score ? Number(profile.avg_score).toFixed(1) : '-' },
        { label: 'Milestones done', value: profile.milestones_done ?? 0 },
      ]
    : [
        { label: 'Role', value: profile.is_master ? 'Master' : 'Admin' },
        { label: 'Platform access', value: 'Full' },
        { label: 'Moderation scope', value: 'Problems' },
        { label: 'Judging mode', value: 'Enabled' },
      ]

  const actions = isStudent
    ? [
        { href: '/problems', title: 'Browse problems', copy: 'Move through the live challenge marketplace and find a brief worth your time.' },
        { href: '/leaderboard', title: 'Open leaderboard', copy: 'See how your Builder Score compares after every judged submission.' },
        { href: `/profile/${profile.profile_slug}`, title: 'View public profile', copy: 'Your public builder profile tracks the challenge work and score history attached to your name.' },
      ]
    : [
        { href: '/admin/problems', title: 'Review problems', copy: 'Approve, edit, or manage challenge briefs entering the platform.' },
        { href: '/admin/judging', title: 'Judge submissions', copy: 'Score student work inside the admin judging flow.' },
        { href: '/admin/analytics', title: 'Open analytics', copy: 'Track the health of the platform across problem volume and participation.' },
      ]

  return (
    <div className="sn-page">
      <div className="sn-hero-band">
        <SiteHeader
          currentPath="/dashboard"
          actions={[
            { href: '/', label: 'Home', tone: 'secondary' },
            { href: isStudent ? '/problems' : '/admin/problems', label: isStudent ? 'Browse problems' : 'Admin queue', tone: 'primary' },
          ]}
        />

        <section className="sn-hero">
          <div className="sn-container sn-hero-grid">
            <div className="sn-stack-lg">
              <div className="sn-fade-up">
                <span className="sn-eyebrow">
                  <span className="sn-eyebrow-dot" />
                  {profile.is_master ? 'Master admin' : profile.role}
                </span>
                <h1 className="sn-hero-title">
                  Welcome back,
                  <br />
                  {profile.name.split(' ')[0]}.
                </h1>
                <p className="sn-hero-copy">
                  {isStudent
                    ? 'Use your dashboard to jump back into live challenges, track score movement, and keep your builder profile active.'
                    : 'Use this workspace to move between moderation, judging, and analytics without losing the marketplace context.'}
                </p>
              </div>

              <div className="sn-grid-4 sn-fade-up sn-fade-up-delay-1">
                {stats.map((stat) => (
                  <div key={stat.label} className="sn-stat-card">
                    <div className="sn-stat-value">{stat.value}</div>
                    <div className="sn-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="sn-hero-panel sn-fade-up sn-fade-up-delay-2">
              <div className="sn-panel-label">Workspace cues</div>
              <h2 className="sn-panel-title">Your next move should never be hidden.</h2>
              <p className="sn-panel-copy">
                Keep the dashboard focused on the next relevant action so you can move back into problems, judging, or public proof with less friction.
              </p>
              <div className="sn-panel-list">
                <div className="sn-panel-item">
                  <strong>{isStudent ? 'Builder path' : 'Operator path'}</strong>
                  <span>{isStudent ? 'Jump back into problems, scores, and public proof.' : 'Move directly into approvals, judging, and analytics.'}</span>
                </div>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="sn-btn sn-btn-light">
                  Sign out
                </button>
              </form>
            </aside>
          </div>
        </section>
      </div>

      <section className="sn-section sn-section-paper">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            label="Actions"
            title={
              <>
                Fast paths back into
                <br />
                meaningful <em>work.</em>
              </>
            }
            copy="The underlying routes are unchanged. What changed is the way the dashboard frames them so the product feels intentional from the moment you log in."
          />

          <div className="sn-grid-3">
            {actions.map((action) => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <article className="sn-card sn-stack-sm">
                  <div className="sn-section-label">Next action</div>
                  <h3 className="sn-card-title">{action.title}</h3>
                  <p className="sn-card-copy">{action.copy}</p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
