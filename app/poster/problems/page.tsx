import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SectionIntro, SiteFooter } from '@/app/ui/site-shell'
import { createClient } from '@/lib/supabase/server'
import { PosterHeader } from '@/app/poster/ui/poster-shell'
import PosterProblemsList from './poster-problems-list'

export default async function PosterProblemsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/poster')

  const { data: profile } = await supabase.from('users').select('role, name').eq('id', user.id).single()

  if (!profile) redirect('/login/poster')
  if (profile.role !== 'poster') redirect('/dashboard')

  const { data: problems } = await supabase
    .from('problems')
    .select('id, title, domain, problem_type, status, reward_amount, milestones, deadline, submission_count, created_at')
    .eq('poster_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="sn-page">
      <PosterHeader currentPath="/poster/problems" posterName={profile.name} />

      <section className="sn-section">
        <div className="sn-container sn-stack-lg">
          <div
            className="sn-fade-up"
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}
          >
            <SectionIntro
              label="Problem management"
              title={
                <>
                  Your posted <em>problems.</em>
                </>
              }
              copy="Edit, publish, hold, or remove your challenge briefs without leaving the poster workspace."
            />
            <Link href="/poster/post-problem" className="sn-btn sn-btn-primary">
              Post a problem
            </Link>
          </div>

          <div className="sn-fade-up sn-fade-up-delay-1">
            <PosterProblemsList problems={(problems ?? []) as any} />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
