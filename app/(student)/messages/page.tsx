import { redirect } from 'next/navigation'
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

  // For DM conversations, fetch the other participant's name
  const dmConversationIds = (memberRows || [])
    .filter((m: any) => m.conversations?.type === 'dm')
    .map((m: any) => m.conversation_id)

  const dmPartnerNames: Record<string, string> = {}
  if (dmConversationIds.length > 0) {
    const { data: dmPartners } = await admin
      .from('conversation_members')
      .select('conversation_id, users!inner(name)')
      .in('conversation_id', dmConversationIds)
      .neq('user_id', user.id)

    for (const row of dmPartners || []) {
      dmPartnerNames[row.conversation_id] = (row.users as any)?.name || 'Unknown'
    }
  }

  const conversations = (memberRows || []).map((m: any) => {
    const conv = m.conversations
    let name: string
    if (conv?.type === 'dm') {
      name = dmPartnerNames[m.conversation_id] || 'Direct Message'
    } else {
      name = conv?.name || conv?.workspaces?.teams?.name || 'General Channel'
    }
    return {
      id: m.conversation_id,
      type: conv?.type,
      name,
      teamName: conv?.workspaces?.teams?.name || 'Workspace'
    }
  })

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px', height: 'calc(100vh - 130px)' }}>
      <MessagesWorkspaceClient
        conversations={conversations}
        currentUserId={user.id}
      />
    </div>
  )
}
