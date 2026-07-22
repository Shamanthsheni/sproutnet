'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  parent_id?: string | null
  content: string
  is_pinned: boolean
  is_edited: boolean
  created_at: string
  sender_name?: string
  reactions?: Array<{ id: string; emoji: string; user_id: string }>
  attachments?: Array<{ id: string; file_url: string; file_name: string; file_type: string }>
}

type Props = {
  conversationId: string
  currentUserId: string
  currentUserName?: string
}

export default function RealtimeChat({ conversationId, currentUserId, currentUserName = 'User' }: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [attachment, setAttachment] = useState<{ url: string; name: string; size: number; type: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  // Fetch initial messages & subscribe to changes
  useEffect(() => {
    let channel: any

    async function loadMessages() {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(name), message_reactions(*), message_attachments(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        const formatted = data.map((m: any) => ({
          ...m,
          sender_name: m.sender?.name || 'Unknown',
          reactions: m.message_reactions || [],
          attachments: m.message_attachments || []
        }))
        setMessages(formatted)
      }
      setLoading(false)
      scrollToBottom()
    }

    loadMessages()

    // Realtime Postgres Changes + Typing Broadcast Channel
    const channelInstance = supabase.channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
        const newMsg = payload.new as Message
        // Fetch sender name
        const { data: userData } = await supabase.from('users').select('name').eq('id', newMsg.sender_id).single()
        newMsg.sender_name = userData?.name || 'User'
        newMsg.reactions = []
        newMsg.attachments = []
        setMessages(prev => [...prev, newMsg])
        scrollToBottom()
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== currentUserId) {
          setTypingUsers(prev => Array.from(new Set([...prev, payload.payload.userName])))
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(name => name !== payload.payload.userName))
          }, 3000)
        }
      })
      .on('broadcast', { event: 'reaction' }, (payload) => {
        const { messageId, emoji, user_id, reacted } = payload.payload
        setMessages(prev => prev.map(msg => {
          if (msg.id !== messageId) return msg
          const existing = msg.reactions || []
          if (reacted) {
            if (existing.some(r => r.emoji === emoji && r.user_id === user_id)) return msg
            return { ...msg, reactions: [...existing, { id: '', emoji, user_id }] }
          } else {
            return { ...msg, reactions: existing.filter(r => !(r.emoji === emoji && r.user_id === user_id)) }
          }
        }))
      })

    channelRef.current = channelInstance
    channelInstance.subscribe()

    return () => {
      if (channelInstance) supabase.removeChannel(channelInstance)
      channelRef.current = null
    }
  }, [conversationId, currentUserId])

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Handle Typing indicator broadcast
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, userName: currentUserName }
      })
    }
  }

  // Handle File Upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${conversationId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(filePath, file)

    if (uploadError) {
      alert('File upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(filePath)

    setAttachment({
      url: publicUrlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type
    })
    setUploading(false)
  }

  // Send Message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if ((!inputText.trim() && !attachment) || uploading) return

    const content = inputText.trim()
    setInputText('')

    const { data: newMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        parent_id: replyTo?.id || null,
        content: content || (attachment ? `Attached file: ${attachment.name}` : '')
      })
      .select()
      .single()

    if (!error && newMsg && attachment) {
      await supabase.from('message_attachments').insert({
        message_id: newMsg.id,
        file_url: attachment.url,
        file_name: attachment.name,
        file_size: attachment.size,
        file_type: attachment.type
      })
      setAttachment(null)
    }

    setReplyTo(null)
  }



  const filteredMessages = messages.filter(m => 
    !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480, background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,20,16,0.08)', overflow: 'hidden'
    }}>
      {/* Top Bar / Search */}
      <div style={{
        padding: '12px 18px', background: '#FAF8F4', borderBottom: '1px solid rgba(28,20,16,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#1C1410' }}>
          Realtime Chat
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: '#fff', border: '1px solid rgba(28,20,16,0.12)', borderRadius: 6, padding: '5px 10px', width: 180 }}
        />
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9CA3A0', fontSize: 14, margin: 'auto' }}>Loading chat history...</div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3A0', fontSize: 14, margin: 'auto' }}>No messages yet. Start the conversation!</div>
        ) : (
          filteredMessages.map(msg => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start'
              }}>
                <div style={{ fontSize: 11, color: '#9CA3A0', marginBottom: 2 }}>
                  {msg.sender_name} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div style={{
                  maxWidth: '78%', background: isMine ? '#2D6A4F' : '#FAF8F4', color: isMine ? '#fff' : '#1C1410',
                  padding: '10px 14px', borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  border: isMine ? 'none' : '1.5px solid rgba(28,20,16,0.07)', fontSize: 14, lineHeight: 1.4
                }}>
                  {msg.parent_id && (
                    <div style={{ fontSize: 12, opacity: 0.8, borderLeft: '2px solid rgba(255,255,255,0.4)', paddingLeft: 6, marginBottom: 4 }}>
                      Replying to thread
                    </div>
                  )}
                  {msg.content}

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      {msg.attachments.map(att => (
                        <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ color: isMine ? '#F4A723' : '#2D6A4F', textDecoration: 'underline', fontSize: 13 }}>
                          📎 {att.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => setReplyTo(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9CA3A0', padding: '2px 6px' }}>
                    Reply
                  </button>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '4px 18px', fontSize: 12, color: '#2D6A4F', fontStyle: 'italic', background: '#FAF8F4' }}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Reply Banner */}
      {replyTo && (
        <div style={{ padding: '6px 18px', background: '#EAF4EE', fontSize: 12, color: '#2D6A4F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Replying to <strong>{replyTo.sender_name}</strong>: &ldquo;{replyTo.content.substring(0, 40)}...&rdquo;</span>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && (
        <div style={{ padding: '6px 18px', background: '#FFF8EA', fontSize: 12, color: '#1C1410', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Attached: 📎 {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)</span>
          <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} style={{
        padding: '12px 18px', background: '#FAF8F4', borderTop: '1px solid rgba(28,20,16,0.07)', display: 'flex', gap: 10, alignItems: 'center'
      }}>
        <label style={{ cursor: 'pointer', fontSize: 18, opacity: 0.7 }} title="Upload file">
          📎
          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={uploading ? 'Uploading attachment...' : 'Type a message... (Press Enter to send)'}
          disabled={uploading}
          style={{
            flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1C1410', background: '#fff', border: '1.5px solid rgba(28,20,16,0.12)', borderRadius: 8, padding: '10px 14px', outline: 'none'
          }}
        />

        <button type="submit" disabled={uploading || (!inputText.trim() && !attachment)} style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#1C1410', background: '#F4A723', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer'
        }}>
          Send →
        </button>
      </form>
    </div>
  )
}
