import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login/mentor', request.url))
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'mentor' && profile.role !== 'admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const formData = await request.formData()
  const bio = (formData.get('bio') as string) || ''
  const skillsRaw = (formData.get('skills') as string) || ''
  const techRaw = (formData.get('technologies') as string) || ''
  const availabilityStatus = (formData.get('availability_status') as string) || 'available'
  const maxActiveTeams = parseInt((formData.get('max_active_teams') as string) || '3', 10)
  const linkedinUrl = (formData.get('linkedin_url') as string) || ''
  const githubUrl = (formData.get('github_url') as string) || ''
  const portfolioUrl = (formData.get('portfolio_url') as string) || ''

  const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const technologies = techRaw.split(',').map(t => t.trim()).filter(Boolean)

  const { error } = await admin
    .from('mentor_profiles')
    .upsert({
      user_id: user.id,
      bio,
      skills,
      technologies,
      availability_status: availabilityStatus,
      max_active_teams: maxActiveTeams,
      linkedin_url: linkedinUrl,
      github_url: githubUrl,
      portfolio_url: portfolioUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating mentor profile:', error)
  }

  return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
}
