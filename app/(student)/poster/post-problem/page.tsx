import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostProblemForm from './post-problem-form'

export default async function PosterPostProblemPage() {
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

  return <PostProblemForm posterName={profile.name} />
}
