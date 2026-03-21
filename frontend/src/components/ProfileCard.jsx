import React from 'react'
import { Link } from 'react-router-dom'
import { Star, User } from 'lucide-react'

export default function ProfileCard({ user, subtitle, style }) {
  if (!user) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', ...style }}>
      <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          background: 'var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          color: 'white'
        }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} />
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: '500', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user.name}
            {user.rating !== undefined && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontSize: '0.85rem' }}>
                <Star size={12} fill="currentColor" />
                {user.rating?.toFixed(1) || '5.0'}
              </span>
            )}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
