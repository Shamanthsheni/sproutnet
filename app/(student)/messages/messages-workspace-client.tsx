'use client'

import { useState } from 'react'
import RealtimeChat from '@/app/components/realtime-chat'

type Conversation = {
  id: string
  type: string
  name: string
  teamName: string
}

type Props = {
  conversations: Conversation[]
  currentUserId: string
}

export default function MessagesWorkspaceClient({ conversations, currentUserId }: Props) {
  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || '')

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .messages-layout {
              display: grid;
              grid-template-columns: 280px 1fr;
              gap: 20px;
              height: 100%;
            }
            .messages-sidebar {
              background: #fff;
              border: 1.5px solid rgba(28,20,16,0.08);
              border-radius: 14px;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            @media (max-width: 768px) {
              .messages-layout {
                grid-template-columns: 1fr;
              }
              .messages-sidebar {
                max-height: 180px;
                overflow-y: auto;
              }
            }
          `,
        }}
      />
      <div className="messages-layout">
        {/* Conversations Sidebar */}
        <div className="messages-sidebar">
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410', marginBottom: 12 }}>
            Conversations
          </h3>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#1C1410', marginBottom: 12 }}>
          Conversations
        </h3>

        {conversations.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9CA3A0', textAlign: 'center', padding: 20 }}>
            No active conversations yet. Join a team or request a mentor to get started!
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id === activeConvId
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  textAlign: 'left', background: isActive ? '#EAF4EE' : '#FAF8F4',
                  border: isActive ? '1.5px solid #2D6A4F' : '1px solid rgba(28,20,16,0.08)',
                  borderRadius: 10, padding: '12px 14px', cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#2D6A4F' : '#1C1410' }}>
                  #{conv.name}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3A0', marginTop: 2 }}>
                  {conv.teamName}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Main Chat View */}
      <div style={{ height: '100%' }}>
        {activeConvId ? (
          <RealtimeChat
            conversationId={activeConvId}
            currentUserId={currentUserId}
          />
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid rgba(28,20,16,0.08)', borderRadius: 14, padding: 40, textAlign: 'center', color: '#9CA3A0', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Select a conversation from the sidebar to start chatting.
          </div>
        )}
      </div>
      </div>
    </>
  )
}
