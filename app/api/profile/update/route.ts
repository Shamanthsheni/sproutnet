import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, dept, year, bio, github, linkedin, twitter, profile_slug } = await req.json() as Record<string, string | undefined>

  const updates: Record<string, string> = {}
  if (name !== undefined) updates.name = name
  if (dept !== undefined) updates.dept = dept
  if (year !== undefined) updates.year = year
  if (bio !== undefined) updates.bio = bio
  if (github !== undefined) updates.github = github
  if (linkedin !== undefined) updates.linkedin = linkedin
  if (twitter !== undefined) updates.twitter = twitter
  if (profile_slug !== undefined) updates.profile_slug = profile_slug

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (profile_slug !== undefined) {
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('profile_slug', profile_slug)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Profile slug already taken' }, { status: 409 })
    }
  }

  const { error } = await admin
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (profile_slug !== undefined) {
    await admin
      .from('leaderboard')
      .update({ profile_slug })
      .eq('profile_slug', user.id)
  }

  return NextResponse.json({ ok: true })
}
