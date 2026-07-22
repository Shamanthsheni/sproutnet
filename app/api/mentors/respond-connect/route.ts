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

  const { notificationId, action } = await req.json().catch(() => ({}))
  if (!notificationId || !action || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 422 })
  }

  // Verify the notification belongs to this mentor
  const { data: notif } = await admin
    .from('notifications')
    .select('id, metadata')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single()

  if (!notif) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }

  // Get mentor name
  const { data: mentorUser } = await admin
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const mentorName = mentorUser?.name || 'Your mentor'
  const studentId = notif.metadata?.student_id

  if (action === 'accept') {
    await admin.from('notifications').update({
      is_read: true,
      metadata: { ...notif.metadata, response: 'accepted' }
    }).eq('id', notificationId)

    // Notify the student
    if (studentId) {
      await admin.from('notifications').insert({
        user_id: studentId,
        event_type: 'MENTOR_ACCEPTED',
        title: 'Mentor Connection Accepted!',
        body: `${mentorName} has accepted your mentorship request. You can now start chatting!`,
        link_url: '/messages',
        metadata: { mentor_id: user.id, conversation_id: notif.metadata?.conversation_id }
      })
    }
  } else {
    await admin.from('notifications').update({
      is_read: true,
      metadata: { ...notif.metadata, response: 'declined' }
    }).eq('id', notificationId)

    // Notify the student
    if (studentId) {
      await admin.from('notifications').insert({
        user_id: studentId,
        event_type: 'MENTOR_REJECTED',
        title: 'Mentor Request Declined',
        body: `${mentorName} has declined your mentorship request. You can connect with other mentors.`,
        link_url: '/mentors',
        metadata: { mentor_id: user.id }
      })
    }
  }

  return NextResponse.json({ ok: true })
}
