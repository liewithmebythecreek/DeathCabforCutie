import React, { useState } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ onSendMessage, disabled, placeholder }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSendMessage(text.trim())
    setText('')
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      style={{ 
        padding: '1rem', 
        borderTop: '1px solid var(--border)', 
        display: 'flex', 
        gap: '0.5rem',
        background: 'rgba(0,0,0,0.1)'
      }}
    >
      <input 
        type="text" 
        className="input-field" 
        placeholder={placeholder} 
        value={text} 
        onChange={e => setText(e.target.value)}
        disabled={disabled}
        style={{ flex: 1, borderRadius: '24px', paddingLeft: '1.25rem' }}
      />
      <button 
        type="submit" 
        className="btn" 
        disabled={disabled || !text.trim()} 
        style={{ 
          padding: '0.75rem', 
          borderRadius: '50%', 
          width: '46px', 
          height: '46px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Send size={18} style={{ marginLeft: '-2px' }} />
      </button>
    </form>
  )
}
