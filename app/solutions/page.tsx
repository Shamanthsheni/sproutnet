import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamEntryKeys, resolveParticipantType } from '@/lib/team-entries'
import { parseDeliverables } from '@/lib/deliverables'

export const dynamic = 'force-dynamic'

type SolutionCard = {
  id: string
  problemId: string
  problemTitle: string
  problemDomain: string | null
  authorName: string
  authorSlug: string | null
  participantType: 'team' | 'individual'
  score: number | null
  feedback: string | null
  deliverables: ReturnType<typeof parseDeliverables>
  completedAt: string
}

export const metadata = {
  title: 'Solutions | SproutNet',
  description: 'Completed student solutions — judged work with apps, repos, research papers, and builds.',
}

export default async function SolutionsPage() {
  const admin = createAdminClient()

  // Only fully-completed solutions: Phase 1 approved AND Phase 2 uploads exist.
  const { data: rows } = await admin
    .from('submissions')
    .select('id, problem_id, student_id, participant_type, score, judge_feedback, final_deliverables, submitted_at')
    .eq('stage', 'full')
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false })
    .limit(100)

  type Row = {
    id: string
    problem_id: string
    student_id: string
    participant_type: string | null
    score: number | null
    judge_feedback: string | null
    final_deliverables: unknown
    f_solution: string | null
    submitted_at: string
  }

  const completed = ((rows ?? []) as Row[]).filter(r => parseDeliverables(r.final_deliverables).length > 0)

  const problemIds = Array.from(new Set(completed.map(r => r.problem_id)))
  const studentIds = Array.from(new Set(completed.map(r => r.student_id)))
  const teamKeys = await getTeamEntryKeys(admin, studentIds)

  const [problemMap, studentMap] = await Promise.all([
    problemIds.length
      ? admin.from('problems').select('id, title, domain').in('id', problemIds).then(
          ({ data }) => new Map(((data ?? []) as Array<{ id: string; title: string; domain: string | null }>).map(p => [p.id, p]))
        )
      : Promise.resolve(new Map()),
    studentIds.length
      ? admin.from('users').select('id, name, profile_slug').in('id', studentIds).then(
          ({ data }) => new Map(((data ?? []) as Array<{ id: string; name: string; profile_slug: string | null }>).map(u => [u.id, u]))
        )
      : Promise.resolve(new Map()),
  ])

  const solutions: SolutionCard[] = completed.map(r => {
    const p = problemMap.get(r.problem_id)
    const u = studentMap.get(r.student_id)
    return {
      id: r.id,
      problemId: r.problem_id,
      problemTitle: p?.title ?? 'Unknown problem',
      problemDomain: p?.domain ?? null,
      authorName: u?.name ?? 'SproutNet builder',
      authorSlug: u?.profile_slug ?? null,
      participantType: resolveParticipantType(r.participant_type, r.student_id, r.problem_id, teamKeys),
      score: r.score ?? null,
      feedback: r.judge_feedback ?? null,
      deliverables: parseDeliverables(r.final_deliverables),
      completedAt: r.submitted_at,
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
            color: '#2D6A4F', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12
          }}>
            {'// shipped & approved'}
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 400,
            color: '#1C1410', letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 10
          }}>
            Completed Solutions
          </h1>
          <p style={{ fontSize: 16, color: '#4A3F38', fontWeight: 300, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Real work from SproutNet builders — every solution here passed admin review
            and delivered its final build, research, and code.
          </p>
        </div>

        {solutions.length === 0 ? (
          <div style={{
            background: '#fff', border: '1.5px solid rgba(28,20,16,0.07)', borderRadius: 18,
            padding: '56px 24px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🌱</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 19, fontWeight: 700, color: '#1C1410', marginBottom: 8 }}>
              No completed solutions yet
            </div>
            <div style={{ fontSize: 14, color: '#7A7068', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
              A solution appears here once it clears admin review <strong>and</strong> the builder
              submits their final work — app links, GitHub repos, papers, and builds.
            </div>
            <Link href="/problems" style={{
              display: 'inline-block', marginTop: 20, fontFamily: 'DM Sans, sans-serif',
              fontSize: 14, fontWeight: 700, color: '#1C1410', background: '#F4A723',
              padding: '12px 22px', borderRadius: 10, textDecoration: 'none'
            }}>
              Browse open problems →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {solutions.map(s => (
              <article key={s.id} style={{
                background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)',
                borderRadius: 18, padding: '26px clamp(20px, 3vw, 30px)',
                boxShadow: '0 6px 24px rgba(28,20,16,0.05)'
              }}>
                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  {s.problemDomain && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      color: '#6A5F58', background: '#F2EEE8', padding: '4px 10px', borderRadius: 6
                    }}>
                      {s.problemDomain}
                    </span>
                  )}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    color: s.participantType === 'team' ? '#2563EB' : '#0D9488',
                    background: s.participantType === 'team' ? 'rgba(37,99,235,0.08)' : 'rgba(13,148,136,0.08)',
                    border: `1px solid ${s.participantType === 'team' ? 'rgba(37,99,235,0.25)' : 'rgba(13,148,136,0.25)'}`,
                    padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>
                    {s.participantType === 'team' ? '👥 Team' : 'Individual'}
                  </span>
                  {s.score != null && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      color: '#2D6A4F', background: '#EAF4EE', border: '1px solid rgba(45,106,79,0.25)',
                      padding: '4px 10px', borderRadius: 999, fontWeight: 600
                    }}>
                      ★ {s.score}/10 judged
                    </span>
                  )}
                </div>

                <h2 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 'clamp(21px, 4vw, 27px)', fontWeight: 400,
                  color: '#1C1410', letterSpacing: '-0.3px', lineHeight: 1.25, margin: '0 0 8px'
                }}>
                  {s.problemTitle}
                </h2>

                <div style={{ fontSize: 13, color: '#7A7068', marginBottom: 14 }}>
                  by{' '}
                  {s.authorSlug ? (
                    <Link href={`/profile/${s.authorSlug}`} style={{ color: '#2D6A4F', fontWeight: 700, textDecoration: 'none' }}>
                      {s.authorName}
                    </Link>
                  ) : (
                    <strong style={{ color: '#1C1410' }}>{s.authorName}</strong>
                  )}
                  {' · '}completed {new Date(s.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {s.feedback && (
                  <p style={{
                    fontSize: 13.5, color: '#4A3F38', background: '#EAF4EE',
                    border: '1px solid rgba(45,106,79,0.18)', borderRadius: 10,
                    padding: '11px 15px', margin: '0 0 16px', fontStyle: 'italic', lineHeight: 1.6
                  }}>
                    Judge&apos;s note: {s.feedback}
                  </p>
                )}

                {/* Final deliverables */}
                <div style={{ display: 'grid', gap: 8 }}>
                  {s.deliverables.map((d, i) => (
                    <a key={`${d.url}-${i}`} href={d.url} target="_blank" rel="noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 15px', borderRadius: 10,
                      border: '1px solid rgba(45,106,79,0.16)', background: '#FAF8F4',
                      textDecoration: 'none', minWidth: 0
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
                        color: d.kind === 'link' ? '#2D6A4F' : '#B45309',
                        background: d.kind === 'link' ? '#EAF4EE' : 'rgba(180,83,9,0.08)',
                        border: `1px solid ${d.kind === 'link' ? 'rgba(45,106,79,0.25)' : 'rgba(180,83,9,0.25)'}`,
                        padding: '3px 8px', borderRadius: 6, flexShrink: 0
                      }}>
                        {d.kind === 'link' ? 'LINK' : 'FILE'}
                      </span>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#1C1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i + 1}. {d.label}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#2D6A4F', flexShrink: 0 }}>open ↗</span>
                    </a>
                  ))}
                </div>

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(28,20,16,0.06)' }}>
                  <Link href={`/problems/${s.problemId}`} style={{ fontSize: 13, fontWeight: 600, color: '#2D6A4F', textDecoration: 'none' }}>
                    View the problem →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
