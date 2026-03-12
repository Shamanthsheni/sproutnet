import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditProblemForm from './edit-problem-form'

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

  const { data: problem } = await supabase
    .from('problems')
    .select('id, title, domain, problem_type, reward_amount, milestones, deadline, judging_deadline, context, problem_stmt, scope, constraints, deliverables, status')
    .eq('id', id)
    .eq('poster_id', user.id)
    .single()

  if (!problem) redirect('/poster/problems')

  return (
    <EditProblemForm posterName={profile.name} problem={problem as any} />
  )
}
