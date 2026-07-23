import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MessagesWorkspaceClient from './messages-workspace-client'

export default async function MessagesPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all conversations user is a member of
  const { data: memberRows } = await admin
    .from('conversation_members')
    .select('conversation_id, conversations(*, workspaces(team_id, teams(name)))')
    .eq('user_id', user.id)

  const conversations = (memberRows || []).map((m: any) => ({
    id: m.conversation_id,
    type: m.conversations?.type,
    name: m.conversations?.name || m.conversations?.workspaces?.teams?.name || 'General Channel',
    teamName: m.conversations?.workspaces?.teams?.name || 'Workspace'
  }))

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px', height: 'calc(100vh - 130px)' }}>
      <MessagesWorkspaceClient
        conversations={conversations}
        currentUserId={user.id}
      />
    </div>
  )
}
