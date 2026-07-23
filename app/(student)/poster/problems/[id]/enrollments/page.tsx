import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PosterEnrollmentsList, { type EnrollmentRow } from './poster-enrollments-list'

export default async function PosterEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const admin = createAdminClient()
  const { data: problem } = await admin
    .from('problems')
    .select('id, title, poster_id')
    .eq('id', id)
    .single()

  if (!problem || problem.poster_id !== user.id) {
    redirect('/poster/problems')
  }

  const { data: enrollments } = await admin
    .from('enrollments')
    .select('id, created_at, student_id, status, users(name, dept, year)')
    .eq('problem_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 6vw, 52px) clamp(16px, 4vw, 24px)' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(26px, 5vw, 34px)',
            fontWeight: 400,
            color: '#1C1410',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            Enrollments
          </h1>
          <p style={{ fontSize: 14, color: '#4A3F38', fontWeight: 300 }}>
            {problem.title}
          </p>
        </div>

        <PosterEnrollmentsList enrollments={(enrollments ?? []) as unknown as EnrollmentRow[]} problemId={id} />
      </div>
  )
}
