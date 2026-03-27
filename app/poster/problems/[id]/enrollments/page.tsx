import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SectionIntro, SiteFooter } from '@/app/ui/site-shell'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PosterHeader } from '@/app/poster/ui/poster-shell'
import PosterEnrollmentsList from './poster-enrollments-list'

export default async function PosterEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/poster')

  const { data: profile } = await supabase.from('users').select('role, name').eq('id', user.id).single()

  if (!profile) redirect('/login/poster')
  if (profile.role !== 'poster') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: problem } = await admin.from('problems').select('id, title, poster_id').eq('id', id).single()

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
    <div className="sn-page">
      <PosterHeader currentPath={`/poster/problems/${id}/enrollments`} posterName={profile.name} />

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <div
            className="sn-fade-up"
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}
          >
            <SectionIntro
              label="Active enrollments"
              title={
                <>
                  Students enrolled in this <em>brief.</em>
                </>
              }
              copy={problem.title}
            />
            <Link href="/poster/problems" className="sn-btn sn-btn-light">
              Back to problems
            </Link>
          </div>

          <div className="sn-fade-up sn-fade-up-delay-1">
            <PosterEnrollmentsList enrollments={(enrollments ?? []) as any} problemId={id} />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
