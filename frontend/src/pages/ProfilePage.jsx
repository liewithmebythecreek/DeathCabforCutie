import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { User, AlertTriangle, ExternalLink, Upload } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setAvatarUrl(user.avatar_url || '')
    }
  }, [user])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      // Preview locally
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    let finalAvatarUrl = avatarUrl

    // 1. Upload image if a new file was selected
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true })
      
      if (uploadError) {
        setLoading(false)
        setMessage({ type: 'error', text: 'Error uploading image: ' + uploadError.message })
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      finalAvatarUrl = publicUrl
    }

    // 2. Check completion rules against the final URL
    const isCompleted = name.trim().length > 0 && finalAvatarUrl.trim().length > 0

    const { error } = await supabase.from('users').update({
      name: name.trim(),
      avatar_url: finalAvatarUrl.trim(),
      profile_completed: isCompleted
    }).eq('id', user.id)

    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: isCompleted ? 'Profile saved and completed! Refreshing context...' : 'Profile saved, but you still need both Name and Avatar to complete it.' })
      if (isCompleted) {
        // Fast hard reload so AuthContext picks up changes
        window.location.reload()
      }
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Profile Settings</h2>
        <Link to={`/profile/${user?.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none' }}>
          View Public Profile <ExternalLink size={16} />
        </Link>
      </div>

      {!user?.profile_completed && (
         <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <AlertTriangle color="#ef4444" size={24} />
           <div>
             <h4 style={{ margin: 0, color: '#ef4444' }}>Profile Incomplete</h4>
             <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>You must provide a Name and an Avatar Image to publish or request rides.</p>
           </div>
         </div>
      )}

      {message && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: message.type === 'error' ? '#ef4444' : '#22c55e', borderRadius: '8px' }}>
          {message.text}
        </div>
      )}

      <form className="glass-card" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: 'white', position: 'relative' }}>
             {avatarUrl ? (
               <img src={avatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {e.target.style.display='none'}} />
             ) : (
               <User size={64} />
             )}
          </div>
          
          <div>
            <label htmlFor="avatar-upload" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <Upload size={16} /> Choose Image
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email (Verified)</label>
          <input type="text" className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Display Name *</label>
          <input required type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>

      </form>
    </div>
  )
}
