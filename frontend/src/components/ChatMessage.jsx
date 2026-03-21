import React from 'react'

export default function ChatMessage({ message, isMe }) {
  if (!message) return null

  return (
    <div style={{ 
      alignSelf: isMe ? 'flex-end' : 'flex-start', 
      maxWidth: '85%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMe ? 'flex-end' : 'flex-start'
    }}>
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)', 
        marginBottom: '0.25rem', 
        paddingLeft: isMe ? '0' : '0.5rem',
        paddingRight: isMe ? '0.5rem' : '0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        justifyContent: isMe ? 'flex-end' : 'flex-start'
      }}>
        {!isMe && message.users?.avatar_url && (
          <img src={message.users.avatar_url} alt="Avatar" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
        )}
        {message.users?.name || 'Unknown User'}
      </div>
      <div style={{ 
        padding: '0.75rem 1rem', 
        borderRadius: '16px', 
        borderBottomRightRadius: isMe ? '4px' : '16px',
        borderBottomLeftRadius: isMe ? '16px' : '4px',
        background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.1)', 
        color: 'white',
        wordBreak: 'break-word',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {message.content}
      </div>
      <div style={{ 
        fontSize: '0.65rem', 
        color: 'var(--text-muted)', 
        marginTop: '0.25rem',
        opacity: 0.7
      }}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
