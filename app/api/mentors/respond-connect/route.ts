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

  if (action === 'accept') {
    await admin.from('notifications').update({
      is_read: true,
      metadata: { ...notif.metadata, response: 'accepted' }
    }).eq('id', notificationId)
  } else {
    await admin.from('notifications').update({
      is_read: true,
      metadata: { ...notif.metadata, response: 'declined' }
    }).eq('id', notificationId)
  }

  return NextResponse.json({ ok: true })
}
