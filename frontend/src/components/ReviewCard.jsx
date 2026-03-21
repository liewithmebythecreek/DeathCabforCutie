import React from 'react'
import { Star, CheckCircle, XCircle } from 'lucide-react'

export default function ReviewCard({ review }) {
  if (!review) return null

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
        {review.users?.avatar_url && (
          <img src={review.users.avatar_url} alt="Reviewer" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
        )}
        By: {review.users?.name || 'Unknown User'}
      </div>
    </div>
  )
}
