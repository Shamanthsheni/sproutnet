import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditProblemForm from './edit-problem-form'
import {
  decodeProblemThumbnailFallback,
  isMissingProblemThumbnailColumnError,
} from '@/lib/problem-thumbnail'

type EditableProblem = {
  id: string
  title: string
  domain: string
  problem_type: string
  thumbnail_url: string | null
  reward_amount: number | null
  milestones: number
  deadline: string
  judging_deadline: string
  context: string
  problem_stmt: string
  scope: string
  constraints: string
  deliverables: string
  status: string
}

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
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

  let { data: problem, error } = await supabase
    .from('problems')
    .select('id, title, domain, problem_type, thumbnail_url, reward_amount, milestones, deadline, judging_deadline, context, problem_stmt, scope, constraints, deliverables, status')
    .eq('id', id)
    .eq('poster_id', user.id)
    .single()

  if (error && isMissingProblemThumbnailColumnError(error.message)) {
    const fallback = await supabase
      .from('problems')
      .select('id, title, domain, problem_type, reward_amount, milestones, deadline, judging_deadline, context, problem_stmt, scope, constraints, deliverables, status, rejected_reason')
      .eq('id', id)
      .eq('poster_id', user.id)
      .single()

    error = fallback.error
    problem = fallback.data
      ? {
          ...fallback.data,
          thumbnail_url: decodeProblemThumbnailFallback(fallback.data.rejected_reason),
        }
      : null
  }

  if (!problem) redirect('/poster/problems')

  return (
    <EditProblemForm posterName={profile.name} problem={problem as EditableProblem} />
  )
}
