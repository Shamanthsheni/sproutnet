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
