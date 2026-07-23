import { createClient } from '@/lib/supabase/server'
import Navbar from '@/app/components/navbar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('id, name, role, is_master, profile_slug')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar user={profile} />
      {children}
    </div>
  )
}