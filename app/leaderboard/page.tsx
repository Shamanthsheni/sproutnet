import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SectionIntro, SiteFooter, SiteHeader } from '@/app/ui/site-shell'

const AVATAR_COLORS = ['#123C86', '#1B5AC0', '#F26900', '#148B63', '#394A68', '#6C4F3F']

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: leaders } = await supabase.from('leaderboard').select('*').limit(50)

  const top3 = leaders?.slice(0, 3) ?? []
  const rest = leaders?.slice(3) ?? []

  return (
    <div className="sn-page">
      <SiteHeader
        currentPath="/leaderboard"
        actions={[
          { href: '/problems', label: 'View Challenges', tone: 'secondary' },
          { href: '/login/student', label: 'Solver Log in', tone: 'primary' },
        ]}
      />

      <section className="sn-hero">
        <div className="sn-container sn-hero-grid">
          <div className="sn-stack-lg sn-fade-up">
            <span className="sn-eyebrow">
              <span className="sn-eyebrow-dot" />
              Community leaderboard
            </span>
            <div className="sn-stack-sm">
              <h1 className="sn-hero-title">
                See who is moving
                <br />
                the marketplace forward.
              </h1>
              <p className="sn-hero-copy">
                Builder Score turns structured work into a visible public signal. This board shows the solvers who are consistently taking challenges seriously.
              </p>
            </div>
          </div>

          <aside className="sn-hero-panel sn-fade-up sn-fade-up-delay-1">
            <div className="sn-panel-label">Board snapshot</div>
            <h2 className="sn-panel-title">Strong work compounds.</h2>
            <div className="sn-panel-list">
              <div className="sn-panel-item">
                <strong>{leaders?.length ?? 0} ranked builders</strong>
                <span>Season performance shown in one public view.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Attempt history matters</strong>
                <span>Consistency across multiple challenges beats one good moment.</span>
              </div>
              <div className="sn-panel-item">
                <strong>Public proof</strong>
                <span>Profiles, scores, and rankings make serious work easier to spot.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <SectionIntro
            label="Top builders"
            title={
              <>
                The current leaders
                <br />
                on the board.
              </>
            }
          />

          {leaders && leaders.length > 0 ? (
            <>
              <div className="sn-grid-3">
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((leader) => {
                  const isFirst = leader.rank === 1
                  return (
                    <Link key={leader.id} href={`/profile/${leader.profile_slug}`} style={{ textDecoration: 'none' }}>
                      <article className="sn-card sn-stack-sm">
                        <div className="sn-split-line">
                          <span className={isFirst ? 'sn-pill sn-pill-accent' : 'sn-pill sn-pill-light'}>Rank #{leader.rank}</span>
                          <span className="sn-meta">{leader.dept}</span>
                        </div>
                        <div className="sn-avatar" style={{ width: 56, height: 56, borderRadius: 18, background: avatarColor(leader.name), fontSize: 18 }}>
                          {initials(leader.name)}
                        </div>
                        <h3 className="sn-card-title">{leader.name}</h3>
                        <p className="sn-card-copy">{leader.year}</p>
                        <div className="sn-card-stat">{leader.builder_score}</div>
                        <p className="sn-card-copy">Builder Score</p>
                      </article>
                    </Link>
                  )
                })}
              </div>

              {rest.length > 0 ? (
                <div className="sn-table-shell" style={{ overflowX: 'auto' }}>
                  <div className="sn-table-head" style={{ gridTemplateColumns: '60px 1.5fr 90px 90px 110px 110px' }}>
                    <span>Rank</span>
                    <span>Builder</span>
                    <span>Tried</span>
                    <span>Avg</span>
                    <span>Milestones</span>
                    <span>Score</span>
                  </div>
                  {rest.map((leader) => (
                    <Link key={leader.id} href={`/profile/${leader.profile_slug}`} style={{ textDecoration: 'none' }}>
                      <div className="sn-table-row" style={{ gridTemplateColumns: '60px 1.5fr 90px 90px 110px 110px' }}>
                        <div className="sn-meta">{leader.rank}</div>
                        <div className="sn-split-line" style={{ justifyContent: 'flex-start' }}>
                          <div className="sn-avatar" style={{ background: avatarColor(leader.name) }}>
                            {initials(leader.name)}
                          </div>
                          <div className="sn-stack-sm" style={{ gap: 2 }}>
                            <strong>{leader.name}</strong>
                            <span className="sn-subtle">{leader.dept} - {leader.year}</span>
                          </div>
                        </div>
                        <div>{leader.attempted}</div>
                        <div>{Number(leader.avg_score).toFixed(1)}</div>
                        <div>{leader.milestones_done}</div>
                        <div className="sn-card-title">{leader.builder_score}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="sn-empty">
              <h3 className="sn-card-title">The board is waiting for the first judged submissions.</h3>
              <p className="sn-card-copy" style={{ marginTop: 10 }}>
                Once challenges are scored, the first builders will start appearing here.
              </p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
