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

  const { messageId, emoji } = await req.json().catch(() => ({}))
  if (!messageId || !emoji) {
    return NextResponse.json({ error: 'messageId and emoji are required' }, { status: 422 })
  }

  // Check if user already reacted with this emoji
  const { data: existing } = await admin
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Remove reaction (toggle off)
    await admin
      .from('message_reactions')
      .delete()
      .eq('id', existing.id)

    return NextResponse.json({ reacted: false, emoji })
  } else {
    // Add reaction
    await admin
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      })

    return NextResponse.json({ reacted: true, emoji })
  }
}
