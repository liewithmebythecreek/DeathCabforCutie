import React from 'react'
import { Link } from 'react-router-dom'
import { Star, User, EyeOff } from 'lucide-react'

/**
 * ProfileCard
 *
 * Props:
 *  user       – { id, name, avatar_url, rating }
 *  subtitle   – optional sub-text below name
 *  style      – extra container styles
 *  anonymize  – when true the real name / avatar are hidden (privacy mode)
 */
export default function ProfileCard({ user, subtitle, style, anonymize = false }) {
  if (!user) return null

  const displayName  = anonymize ? 'User' : (user.name || 'User')
  const showAvatar   = !anonymize && user.avatar_url

  const avatarCircle = (
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: anonymize ? 'var(--border)' : 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      color: anonymize ? 'var(--text-muted)' : 'white',
      flexShrink: 0,
    }}>
      {showAvatar ? (
        <img
          src={user.avatar_url}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <User size={20} />
      )}
    </div>
  )

  const nameBlock = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontWeight: '500', color: anonymize ? 'var(--text-muted)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {displayName}
        {!anonymize && user.rating !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontSize: '0.85rem' }}>
            <Star size={12} fill="currentColor" />
            {user.rating?.toFixed(1) || '5.0'}
          </span>
        )}
        {anonymize && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.07)',
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
            border: '1px solid var(--border)'
          }}>
            <EyeOff size={10} /> hidden
          </span>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  )

  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {avatarCircle}
      {nameBlock}
    </div>
  )

  // Always link to profile — the profile page handles its own anonymization display.
  // When anonymize=true we still show the card as "hidden" visually, but the
  // viewer can still navigate to see reviews and ride history.
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', ...style }}>
      <Link
        to={`/profile/${user.id}`}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}
        title={anonymize ? 'View profile (identity hidden)' : undefined}
      >
        {inner}
      </Link>
    </div>
  )
}
