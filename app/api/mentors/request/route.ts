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

  const formData = await request.formData()
  const requestId = formData.get('requestId') as string
  const action = formData.get('action') as string

  if (!requestId || !['accept', 'reject'].includes(action)) {
    return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
  }

  // Fetch the mentor request
  const { data: reqData } = await admin
    .from('mentor_requests')
    .select('*, teams(id, name, leader_id)')
    .eq('id', requestId)
    .eq('mentor_id', user.id)
    .single()

  if (!reqData) {
    return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
  }

  const newStatus = action === 'accept' ? 'accepted' : 'rejected'

  // Update request status
  await admin
    .from('mentor_requests')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (action === 'accept') {
    // Insert into mentor_assignments
    await admin
      .from('mentor_assignments')
      .upsert({
        team_id: reqData.team_id,
        mentor_id: user.id
      }, { onConflict: 'team_id, mentor_id' })

    // Ensure Workspace exists for team
    let { data: workspace } = await admin
      .from('workspaces')
      .select('id')
      .eq('team_id', reqData.team_id)
      .maybeSingle()

    if (!workspace) {
      const { data: newWs } = await admin
        .from('workspaces')
        .insert({ team_id: reqData.team_id })
        .select()
        .single()
      workspace = newWs
    }

    if (workspace) {
      // Create default general channel if not existing
      let { data: channel } = await admin
        .from('conversations')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('type', 'channel')
        .maybeSingle()

      if (!channel) {
        const { data: newChan } = await admin
          .from('conversations')
          .insert({
            workspace_id: workspace.id,
            type: 'channel',
            name: 'general',
            description: 'General team and mentor collaboration channel',
            created_by: user.id
          })
          .select()
          .single()
        channel = newChan
      }

      // Add mentor to conversation members
      if (channel) {
        await admin
          .from('conversation_members')
          .upsert({
            conversation_id: channel.id,
            user_id: user.id
          }, { onConflict: 'conversation_id, user_id' })
      }
    }

    // Send Notification to Team Leader
    await admin
      .from('notifications')
      .insert({
        user_id: reqData.requested_by,
        event_type: 'MENTOR_ACCEPTED',
        title: 'Mentor Request Accepted!',
        body: `A mentor has accepted your request for team "${reqData.teams?.name}". You can now collaborate in your Team Workspace.`,
        link_url: `/teams/${reqData.team_id}`,
        metadata: { team_id: reqData.team_id, mentor_id: user.id }
      })
  } else {
    // Send Rejected Notification
    await admin
      .from('notifications')
      .insert({
        user_id: reqData.requested_by,
        event_type: 'MENTOR_REJECTED',
        title: 'Mentor Request Declined',
        body: `Your mentor request for team "${reqData.teams?.name}" was declined. You can request another mentor.`,
        link_url: `/teams/${reqData.team_id}`,
        metadata: { team_id: reqData.team_id, mentor_id: user.id }
      })
  }

  return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
}
