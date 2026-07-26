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

  const { mentorId, message } = await req.json().catch(() => ({}))
  if (!mentorId) {
    return NextResponse.json({ error: 'Mentor ID is required' }, { status: 422 })
  }

  // Verify user is a student
  const { data: profile } = await admin
    .from('users')
    .select('id, name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Only students can connect with mentors' }, { status: 403 })
  }

  // Check if mentor exists and is available
  const { data: mentorProf } = await admin
    .from('mentor_profiles')
    .select('user_id, availability_status')
    .eq('user_id', mentorId)
    .single()

  if (!mentorProf) {
    return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
  }

  if (mentorProf.availability_status === 'unavailable') {
    return NextResponse.json({ error: 'This mentor is currently unavailable.' }, { status: 400 })
  }

  // Check for existing pending connection
  const { data: existing } = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', mentorId)
    .eq('event_type', 'MENTOR_CONNECT_REQUEST')
    .eq('metadata->>student_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already have a pending connection request with this mentor.' }, { status: 400 })
  }

  // Get student name
  const studentName = profile.name || 'A student'

  // Create or find DM conversation between student and mentor
  const { data: studentConvs } = await admin
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)
  const studentConvIds = (studentConvs || []).map(c => c.conversation_id)

  const { data: mentorConvs } = await admin
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', mentorId)
  const mentorConvIds = new Set((mentorConvs || []).map(c => c.conversation_id))

  const sharedConvId = studentConvIds.find(id => mentorConvIds.has(id))

  let conversationId: string | null = sharedConvId || null

  if (!conversationId) {
    const { data: conv } = await admin
      .from('conversations')
      .insert({
        type: 'dm',
        created_by: user.id
      })
      .select()
      .single()

    if (conv) {
      conversationId = conv.id
      await admin.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: mentorId }
      ])
    }
  }

  // Send notification to mentor
  const { data: notifRow } = await admin.from('notifications').insert({
    user_id: mentorId,
    event_type: 'MENTOR_CONNECT_REQUEST',
    title: 'New Mentorship Connection',
    body: message
      ? `${studentName} wants to connect: "${message}"`
      : `${studentName} wants to connect with you for mentorship.`,
    link_url: '/mentor/dashboard',
    metadata: {
      student_id: user.id,
      student_name: studentName,
      message: message || null,
      conversation_id: conversationId,
    }
  }).select('id').single()

  // Update link_url to point to the dedicated profile page
  if (notifRow) {
    await admin.from('notifications').update({
      link_url: `/mentor/connect/${notifRow.id}`
    }).eq('id', notifRow.id)
  }

  // Log activity
  await admin.from('activity_logs').insert({
    actor_id: user.id,
    action_type: 'MENTOR_CONNECT_REQUEST',
    description: `${studentName} sent a mentorship connection request.`,
    metadata: { mentor_id: mentorId }
  })

  return NextResponse.json({ ok: true, conversationId })
}
