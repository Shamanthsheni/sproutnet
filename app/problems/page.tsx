import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const DOMAINS = ['All', 'AI & Data', 'Climate', 'Public Infrastructure', 'Healthcare', 'Agriculture', 'Education', 'Urban Mobility', 'Civic Technology']

const DOMAIN_ICONS: Record<string, string> = {
  'AI & Data': '🤖',
  'Climate': '🌿',
  'Public Infrastructure': '🏗',
  'Healthcare': '🏥',
  'Agriculture': '🌾',
  'Education': '📚',
  'Urban Mobility': '🚌',
  'Civic Technology': '🏛',
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

  if (selectedDomain !== 'All') {
    query = query.eq('domain', selectedDomain)
  }
  if (selectedType !== 'all') {
    query = query.eq('problem_type', selectedType)
  }

  const { data: problems } = await query

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        minHeight: 66,
        height: 'auto',
        padding: '12px clamp(16px, 4vw, 52px)',
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: 10,
        columnGap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.94)',
        borderBottom: '1px solid rgba(28,20,16,0.07)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F"/>
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723"/>
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div className="sn-nav-actions" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
          <Link href="/problems" style={{ fontSize: 14, fontWeight: 500, color: '#1C1410', textDecoration: 'none' }}>Problems</Link>
          <Link href="/leaderboard" style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38', textDecoration: 'none' }}>Leaderboard</Link>
          <Link href="/dashboard" style={{
            fontSize: 14, fontWeight: 600, color: '#1C1410',
            background: '#F4A723', padding: '8px 20px',
            borderRadius: 6, textDecoration: 'none'
          }}>Dashboard →</Link>
        </div>
        <details className="sn-mobile-menu">
          <summary aria-label="Open navigation menu">
            <span className="sn-menu-icon" aria-hidden="true"></span>
            <span className="sn-menu-label">Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            <Link href="/problems">Problems</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/dashboard" className="sn-menu-primary">Dashboard â†’</Link>
          </div>
        </details>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#2D6A4F',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 12
          }}>
            // open problems · season 1
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 400,
            color: '#1C1410', letterSpacing: '-0.5px',
            marginBottom: 12
          }}>
            Real problems.<br />Waiting for your thinking.
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300 }}>
            {problems?.length ?? 0} open problems across {selectedDomain === 'All' ? '8 domains' : selectedDomain}
          </p>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 36 }}>
          {/* Type filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: 'All Types' },
              { value: 'public_impact', label: '🌍 Public Impact' },
              { value: 'industry_challenge', label: '💼 Industry Challenge' },
            ].map(t => (
              <Link key={t.value} href={`/problems?domain=${selectedDomain}&type=${t.value}`} style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13, fontWeight: 500,
                padding: '7px 16px', borderRadius: 999,
                textDecoration: 'none',
                background: selectedType === t.value ? '#1C1410' : '#fff',
                color: selectedType === t.value ? '#FAF8F4' : '#4A3F38',
                border: `1.5px solid ${selectedType === t.value ? '#1C1410' : 'rgba(28,20,16,0.12)'}`,
              }}>
                {t.label}
              </Link>
            ))}
          </div>

          {/* Domain filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DOMAINS.map(d => (
              <Link key={d} href={`/problems?domain=${d}&type=${selectedType}`} style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 999,
                textDecoration: 'none',
                background: selectedDomain === d ? '#2D6A4F' : '#fff',
                color: selectedDomain === d ? '#fff' : '#4A3F38',
                border: `1.5px solid ${selectedDomain === d ? '#2D6A4F' : 'rgba(28,20,16,0.12)'}`,
              }}>
                {d !== 'All' && DOMAIN_ICONS[d]} {d}
              </Link>
            ))}
          </div>
        </div>

        {/* Problems grid */}
        {problems && problems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {problems.map(problem => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: 12,
            border: '1.5px solid rgba(28,20,16,0.07)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 18, fontWeight: 600,
              color: '#1C1410', marginBottom: 8
            }}>
              No problems found
            </div>
            <div style={{ fontSize: 14, color: '#9CA3A0' }}>
              Try a different domain or type filter.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProblemCard({ problem }: { problem: {
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
}}) {
  const isIndustry = problem.problem_type === 'industry_challenge'
  const daysLeft = Math.ceil((new Date(problem.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const contextSnippet = problem.context.slice(0, 140) + '...'

  return (
    <Link href={`/problems/${problem.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.07)',
        borderRadius: 14,
        padding: 'clamp(20px, 3vw, 28px)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Domain badge */}
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12, fontWeight: 500,
            color: '#2D6A4F', background: '#EAF4EE',
            border: '1px solid rgba(45,106,79,0.15)',
            padding: '4px 10px', borderRadius: 999
          }}>
            {DOMAIN_ICONS[problem.domain]} {problem.domain}
          </span>

          {/* Type badge */}
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12, fontWeight: 500,
            color: isIndustry ? '#1E40AF' : '#4A3F38',
            background: isIndustry ? 'rgba(30,64,175,0.08)' : 'rgba(28,20,16,0.05)',
            border: `1px solid ${isIndustry ? 'rgba(30,64,175,0.15)' : 'rgba(28,20,16,0.1)'}`,
            padding: '4px 10px', borderRadius: 999
          }}>
            {isIndustry ? `💼 ₹${problem.reward_amount?.toLocaleString('en-IN')}` : '🌍 Public Impact'}
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 16, fontWeight: 600,
          color: '#1C1410', lineHeight: 1.4,
          margin: 0
        }}>
          {problem.title}
        </h2>

        {/* Context snippet */}
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13, color: '#4A3F38',
          fontWeight: 300, lineHeight: 1.6,
          margin: 0, flex: 1
        }}>
          {contextSnippet}
        </p>

        {/* Footer stats */}
        <div style={{
          display: 'flex', gap: 20, rowGap: 8, flexWrap: 'wrap',
          paddingTop: 14,
          borderTop: '1px solid rgba(28,20,16,0.06)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14, fontWeight: 500,
              color: daysLeft <= 7 ? '#DC2626' : '#F4A723'
            }}>
              {daysLeft}d
            </span>
            <span style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              left
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14, fontWeight: 500, color: '#2D6A4F'
            }}>
              {problem.milestones}
            </span>
            <span style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              milestones
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14, fontWeight: 500, color: '#1C1410'
            }}>
              {problem.submission_count}
            </span>
            <span style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              submissions
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13, fontWeight: 600,
              color: '#2D6A4F'
            }}>
              View →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
