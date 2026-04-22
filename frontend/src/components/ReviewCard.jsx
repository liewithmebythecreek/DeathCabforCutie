import React from 'react'
import { Star, CheckCircle, XCircle, User, EyeOff } from 'lucide-react'

export default function ReviewCard({ review }) {
  if (!review) return null

  // Anonymize the reviewer if they've opted out of showing their identity
  const reviewerAnon   = review.users?.show_identity === false
  const reviewerName   = reviewerAnon ? 'User' : (review.users?.name || 'Unknown User')
  const reviewerAvatar = reviewerAnon ? null : review.users?.avatar_url

  return (
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {review.did_ride_happen ? (
            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
              <CheckCircle size={14} /> Ride Happened
            </span>
          ) : (
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
              <XCircle size={14} /> Did Not Happen
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {new Date(review.created_at).toLocaleDateString()}
        </div>
      </div>
      
      {review.rating !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', marginBottom: '0.5rem' }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} color={i < review.rating ? '#fbbf24' : 'var(--border)'} />
          ))}
        </div>
      )}
      
      {review.comment && (
        <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
          "{review.comment}"
        </div>
      )}
      
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          background: reviewerAnon ? 'var(--border)' : 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          color: reviewerAnon ? 'var(--text-muted)' : 'white'
        }}>
          {reviewerAvatar ? (
            <img src={reviewerAvatar} alt="Reviewer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={12} />
          )}
        </div>
        <span>By: {reviewerName}</span>
        {reviewerAnon && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
            fontSize: '0.7rem', color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.35rem',
            borderRadius: '4px', border: '1px solid var(--border)'
          }}>
            <EyeOff size={9} /> hidden
          </span>
        )}
      </div>
    </div>
  )
}
