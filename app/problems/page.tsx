import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/app/components/navbar'
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

type ProblemFallbackRow = Omit<ProblemCardData, 'thumbnail_url'> & {
  rejected_reason?: string | null
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

  const { data: { user: authUser } } = await (await createClient()).auth.getUser()
  let user: { id: string; name: string; role: string; is_master?: boolean; profile_slug?: string | null } | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, name, role, is_master, profile_slug')
      .eq('id', authUser.id)
      .single()
    user = profile
  }

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

  let problems: ProblemCardData[] = []
  let error: { message: string } | null = null

  try {
    const initialResult = await buildProblemsQuery(
      'id, title, domain, problem_type, status, thumbnail_url, reward_amount, milestones, deadline, submission_count, context, difficulty_label, difficulty_score, impact_score, estimated_hours'
    )

    error = initialResult.error
    if (!error) {
      problems = (initialResult.data ?? []) as unknown as ProblemCardData[]
    }

    if (error && isMissingProblemThumbnailColumnError(error.message)) {
      const fallback = await buildProblemsQuery(
        'id, title, domain, problem_type, status, reward_amount, milestones, deadline, submission_count, context, rejected_reason, difficulty_label, difficulty_score, impact_score, estimated_hours'
      )
      error = fallback.error
      if (!error) {
        problems = ((fallback.data ?? []) as unknown as ProblemFallbackRow[]).map(problem => ({
          ...problem,
          thumbnail_url: decodeProblemThumbnailFallback(problem.rejected_reason),
        }))
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed.'
    error = { message }
  }

  if (error) {
    console.error('Problems page query failed:', error.message)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar user={user} />

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
              <ProblemCard key={problem.id} problem={problem} />
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
