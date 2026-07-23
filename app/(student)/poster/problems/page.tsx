import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PosterProblemsList, { type ProblemRow } from './poster-problems-list'

export default async function PosterProblemsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/poster')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login/poster')
  if (profile.role !== 'poster') redirect('/dashboard')

  const { data: problems } = await supabase
    .from('problems')
    .select('id, title, domain, problem_type, status, reward_amount, milestones, deadline, submission_count, created_at')
    .eq('poster_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(28px, 6vw, 38px)',
              fontWeight: 400,
              color: '#1C1410',
              letterSpacing: '-0.5px',
              marginBottom: 8
            }}>
              My problems
            </h1>
            <p style={{ fontSize: 15, color: '#4A3F38', fontWeight: 300 }}>
              Edit, hold, or delete the problems you&apos;ve posted.
            </p>
          </div>
          <Link href="/poster/post-problem" style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#1C1410',
            background: '#F4A723',
            padding: '10px 18px',
            borderRadius: 8,
            textDecoration: 'none'
          }}>
            + Post a Problem
          </Link>
        </div>

        <PosterProblemsList problems={(problems ?? []) as ProblemRow[]} />
      </div>
  )
}
