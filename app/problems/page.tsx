import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ProblemCard, { type ProblemCardData } from './problem-card'
import {
  decodeProblemThumbnailFallback,
  isMissingProblemThumbnailColumnError,
} from '@/lib/problem-thumbnail'

export const dynamic = 'force-dynamic'

const DOMAINS = ['All', 'AI & Data', 'Climate', 'Public Infrastructure', 'Healthcare', 'Agriculture', 'Education', 'Urban Mobility', 'Civic Technology']

const DOMAIN_ICONS: Record<string, string> = {
  'AI & Data': '🤖',
  Climate: '🌿',
  'Public Infrastructure': '🏗',
  Healthcare: '🏥',
  Agriculture: '🌾',
  Education: '📚',
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

  const supabase = createAdminClient()

  function buildProblemsQuery(columns: string) {
    let query = supabase
      .from('problems')
      .select(columns)
      .order('created_at', { ascending: false })
      .eq('status', 'open')

    if (selectedDomain !== 'All') {
      query = query.eq('domain', selectedDomain)
    }
    if (selectedType !== 'all') {
      query = query.eq('problem_type', selectedType)
    }

    return query
  }

  let { data: problems, error } = await buildProblemsQuery('id, title, domain, problem_type, status, thumbnail_url, reward_amount, milestones, deadline, submission_count, context')

  if (error && isMissingProblemThumbnailColumnError(error.message)) {
    const fallback = await buildProblemsQuery('id, title, domain, problem_type, status, reward_amount, milestones, deadline, submission_count, context, rejected_reason')
    error = fallback.error
    problems = (fallback.data ?? []).map(problem => ({
      ...problem,
      thumbnail_url: decodeProblemThumbnailFallback(problem.rejected_reason),
    }))
  }

  if (error) {
    console.error('Problems page query failed:', error.message)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
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
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="8" fill="#2D6A4F" />
            <line x1="17" y1="27" x2="17" y2="15" stroke="#FAF8F4" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M17 21 C16 19 13 18 11 14.5 C11 14.5 15.5 13 17 17.5" fill="#F4A723" />
            <path d="M17 18 C18 15.5 21.5 14 24 10.5 C24 10.5 19.5 10 17 14.5" fill="rgba(250,248,244,0.88)" />
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1C1410' }}>SproutNet</span>
        </Link>
        <div className="sn-nav-actions" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
          <Link href="/problems" style={{ fontSize: 14, fontWeight: 500, color: '#1C1410', textDecoration: 'none' }}>Problems</Link>
          <Link href="/leaderboard" style={{ fontSize: 14, fontWeight: 500, color: '#4A3F38', textDecoration: 'none' }}>Leaderboard</Link>
          <Link href="/dashboard" style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1C1410',
            background: '#F4A723',
            padding: '8px 20px',
            borderRadius: 6,
            textDecoration: 'none',
          }}>
            Dashboard →
          </Link>
        </div>
        <details className="sn-mobile-menu">
          <summary aria-label="Open navigation menu">
            <span className="sn-menu-icon" aria-hidden="true"></span>
            <span className="sn-menu-label">Menu</span>
          </summary>
          <div className="sn-mobile-panel">
            <Link href="/problems">Problems</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/dashboard" className="sn-menu-primary">Dashboard →</Link>
          </div>
        </details>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#2D6A4F',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {'// open problems · season 1'}
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(32px, 7vw, 48px)',
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 12,
          }}>
            Real problems.<br />Waiting for your thinking.
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300 }}>
            {problems?.length ?? 0} open problems across {selectedDomain === 'All' ? '8 domains' : selectedDomain}
          </p>
        </div>

        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: 'All Types' },
              { value: 'public_impact', label: '🌍 Public Impact' },
              { value: 'industry_challenge', label: '💼 Industry Challenge' },
            ].map(t => (
              <Link
                key={t.value}
                href={`/problems?domain=${selectedDomain}&type=${t.value}`}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '7px 16px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  background: selectedType === t.value ? '#1C1410' : '#fff',
                  color: selectedType === t.value ? '#FAF8F4' : '#4A3F38',
                  border: `1.5px solid ${selectedType === t.value ? '#1C1410' : 'rgba(28,20,16,0.12)'}`,
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DOMAINS.map(d => (
              <Link
                key={d}
                href={`/problems?domain=${d}&type=${selectedType}`}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '6px 14px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  background: selectedDomain === d ? '#2D6A4F' : '#fff',
                  color: selectedDomain === d ? '#fff' : '#4A3F38',
                  border: `1.5px solid ${selectedDomain === d ? '#2D6A4F' : 'rgba(28,20,16,0.12)'}`,
                }}
              >
                {d !== 'All' && DOMAIN_ICONS[d]} {d}
              </Link>
            ))}
          </div>
        </div>

        {error ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: '#fff',
            borderRadius: 12,
            border: '1.5px solid rgba(220,38,38,0.12)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
            <div style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              color: '#1C1410',
              marginBottom: 8,
            }}>
              Couldn&apos;t load problems
            </div>
            <div style={{ fontSize: 14, color: '#9CA3A0' }}>
              Refresh the page in a moment. If this keeps happening, the server query needs attention.
            </div>
          </div>
        ) : problems && problems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {problems.map(problem => (
              <ProblemCard key={problem.id} problem={problem as ProblemCardData} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: '#fff',
            borderRadius: 12,
            border: '1.5px solid rgba(28,20,16,0.07)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              color: '#1C1410',
              marginBottom: 8,
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
