import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Notifications
  const { data: notifications } = await admin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Mark all unread as read
  await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const items = notifications || []

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: '#1C1410', marginBottom: 8 }}>
          Notifications
        </h1>
        <p style={{ fontSize: 15, color: '#4A3F38', marginBottom: 28 }}>
          Stay updated on mentor acceptances, team requests, and workspace updates.
        </p>

        {items.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: 36, textAlign: 'center', color: '#9CA3A0' }}>
            You have no notifications yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(n => (
              <div key={n.id} style={{
                background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 12, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                    {n.event_type}
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#1C1410' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#4A3F38', marginTop: 4 }}>
                    {n.body}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3A0', marginTop: 6 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>

                {n.link_url && (
                  <Link href={n.link_url} style={{
                    fontSize: 13, fontWeight: 600, color: '#1C1410', background: '#F4A723', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap'
                  }}>
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  )
}
