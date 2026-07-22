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

  const convIds = (memberRows || []).map(m => m.conversation_id)

  // For DM conversations, fetch the other participant's name
  const dmOtherNames = new Map<string, string>()
  if (convIds.length > 0) {
    const dmConvIds = (memberRows || [])
      .filter(m => {
        const c = m.conversations
        const conv = (Array.isArray(c) ? c[0] : c) as Record<string, unknown> | null
        return conv?.type === 'dm'
      })
      .map(m => m.conversation_id)

    if (dmConvIds.length > 0) {
      const { data: dmMembers } = await admin
        .from('conversation_members')
        .select('conversation_id, user_id')
        .in('conversation_id', dmConvIds)
        .neq('user_id', user.id)

      const otherUserIds = dmMembers?.map(dm => dm.user_id) || []
      if (otherUserIds.length > 0) {
        const { data: otherUsers } = await admin
          .from('users')
          .select('id, name')
          .in('id', otherUserIds)

        const userMap = new Map((otherUsers || []).map(u => [u.id, u.name]))
        for (const dm of dmMembers || []) {
          dmOtherNames.set(dm.conversation_id, userMap.get(dm.user_id) || 'Unknown')
        }
      }
    }
  }

  const conversations = (memberRows || [])
    .filter((m: any) => {
      const convRaw = m.conversations
      const conv = (Array.isArray(convRaw) ? convRaw[0] : convRaw) as Record<string, unknown> | null
      return conv?.type === 'dm'
    })
    .map((m: Record<string, unknown>) => {
      const convRaw = m.conversations
      const conv = (Array.isArray(convRaw) ? convRaw[0] : convRaw) as Record<string, unknown> | null
      const convName = (conv?.name as string) || ''
      const convType = conv?.type as string | undefined
      const ws = conv?.workspaces as Record<string, unknown> | null
      const team = ws?.teams as Record<string, unknown> | null
      const teamName = (team?.name as string) || ''
      const dmName = convName ? '' : (convType === 'dm' ? (dmOtherNames.get(m.conversation_id as string) || 'Direct Message') : '')
      const resolvedName = convName || dmName || teamName || 'General Channel'
      return {
        id: m.conversation_id as string,
        type: convType || '',
        name: resolvedName,
        teamName: teamName || 'Workspace'
      }
    })

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{
        padding: '12px clamp(16px, 4vw, 52px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(250,248,244,0.94)', borderBottom: '1px solid rgba(28,20,16,0.07)'
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1C1410', fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/notifications" style={{
            fontSize: 13, fontWeight: 600, color: '#2D6A4F', background: '#EAF4EE',
            padding: '4px 10px', borderRadius: 8, textDecoration: 'none'
          }}>
            Notifications
          </Link>
          <span style={{ fontSize: 13, color: '#2D6A4F', background: '#EAF4EE', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
            Realtime Messaging Portal
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px', height: 'calc(100vh - 130px)' }}>
        <MessagesWorkspaceClient
          conversations={conversations}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
