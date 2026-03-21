import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { MessageCircle } from 'lucide-react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

export default function RideChat({ rideId, currentUserId, canChat, isCompleted }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!rideId || !canChat) {
      setLoading(false)
      return
    }

    fetchMessages()

    const chatSub = supabase.channel(`public:chat_messages:ride_id=eq.${rideId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `ride_id=eq.${rideId}` }, (payload) => {
        // We fetch the full message with user data instead of appending directly to ensure we have the names
        fetchSingleMessage(payload.new.id)
      })
      .subscribe()

    return () => {
      chatSub.unsubscribe()
    }
  }, [rideId, canChat])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    setLoading(true)
    const { data: msgData, error } = await supabase
      .from('chat_messages')
      .select(`*, users!sender_id(name, avatar_url)`)
      .eq('ride_id', rideId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (!error && msgData) {
      // Revert order for rendering (oldest first)
      setMessages(msgData.reverse())
    }
    setLoading(false)
  }

  const fetchSingleMessage = async (messageId) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`*, users!sender_id(name, avatar_url)`)
      .eq('id', messageId)
      .single()
    
    if (!error && data) {
      setMessages(prev => [...prev, data])
    }
  }

  const handleSendMessage = async (text) => {
    const { error } = await supabase.from('chat_messages').insert([
      { ride_id: rideId, sender_id: currentUserId, content: text }
    ])
    if (error) console.error("Error sending message:", error)
  }

  let placeholder = "Type a message..."
  if (!canChat) placeholder = "Chat hidden"
  if (isCompleted) placeholder = "Chat closed"

  return (
    <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '600px', padding: 0, overflow: 'hidden' }}>
      
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <MessageCircle size={20} color="var(--primary)" /> Ride Chat
        </h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {!canChat ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>
            <MessageCircle size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div>Chat is only available for approved<br/>passengers and the ride creator.</div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Say hello! Start coordinating your ride.</div>
        ) : (
          messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} isMe={msg.sender_id === currentUserId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={!canChat || isCompleted} 
        placeholder={placeholder}
      />
      
    </div>
  )
}
