import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId, mentorId, message } = await req.json().catch(() => ({}))

  if (!teamId || !mentorId) {
    return NextResponse.json({ error: 'Team ID and Mentor ID are required' }, { status: 422 })
  }

  // Verify user is member of team
  const { data: membership } = await admin
    .from('team_members')
    .select('id, role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden. You are not a member of this team.' }, { status: 403 })
  }

  // Check mentor profile & availability
  const { data: mentorProf } = await admin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', mentorId)
    .single()

  if (!mentorProf || mentorProf.availability_status === 'unavailable') {
    return NextResponse.json({ error: 'This mentor is currently unavailable.' }, { status: 400 })
  }

  // Check active assignments count
  const { count: currentAssignments } = await admin
    .from('mentor_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('mentor_id', mentorId)

  if ((currentAssignments ?? 0) >= mentorProf.max_active_teams) {
    return NextResponse.json({ error: 'This mentor has reached their maximum active team capacity.' }, { status: 400 })
  }

  // Create Mentor Request
  const { data: mentorReq, error: reqErr } = await admin
    .from('mentor_requests')
    .insert({
      team_id: teamId,
      mentor_id: mentorId,
      requested_by: user.id,
      message: message ? message.trim() : null
    })
    .select()
    .single()

  if (reqErr) {
    if (reqErr.code === '23505') {
      return NextResponse.json({ error: 'A mentorship request has already been sent to this mentor.' }, { status: 400 })
    }
    return NextResponse.json({ error: reqErr.message }, { status: 400 })
  }

  // Notify Mentor
  const { data: team } = await admin.from('teams').select('name').eq('id', teamId).single()
  await admin.from('notifications').insert({
    user_id: mentorId,
    event_type: 'MENTOR_REQUEST_RECEIVED',
    title: 'New Mentorship Request',
    body: `Team "${team?.name || 'A team'}" requested your guidance.`,
    link_url: '/mentor/dashboard',
    metadata: { team_id: teamId, request_id: mentorReq.id }
  })

  return NextResponse.json({ ok: true, requestId: mentorReq.id })
}
