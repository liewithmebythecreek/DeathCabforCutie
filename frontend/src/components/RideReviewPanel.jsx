import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function RideReviewPanel({ ride, currentUser, requests, onReviewSubmitted }) {
  const isCreator = currentUser.id === ride.creator_id
  const [loading, setLoading] = useState(false)
  
  // For Creator reviewing multiple passengers
  const approvedPassengers = requests.filter(r => r.status === 'approved')
  
  // State to hold reviews: { [userId]: { didHappen: true, rating: 5, comment: '' } }
  const [reviewsState, setReviewsState] = useState(() => {
    if (isCreator) {
      const initialState = {}
      approvedPassengers.forEach(p => {
        initialState[p.user_id] = { didHappen: true, rating: 5, comment: '' }
      })
      return initialState
    } else {
      return {
        [ride.creator_id]: { didHappen: true, rating: 5, comment: '' }
      }
    }
  })

  const handleChange = (targetId, field, value) => {
    setReviewsState(prev => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        [field]: value
      }
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const reviewPayloads = Object.keys(reviewsState).map(targetId => {
        const rev = reviewsState[targetId]
        return {
          ride_id: ride.id,
          reviewer_id: currentUser.id,
          reviewee_id: targetId,
          review_type: isCreator ? 'publisher_review' : 'rider_review',
          did_ride_happen: rev.didHappen,
          rating: rev.didHappen ? parseInt(rev.rating) : null,
          comment: rev.comment
        }
      })
      
      // Prevent duplicates by checking if they already exist
      const { data: existing } = await supabase
        .from('ride_reviews')
        .select('id')
        .eq('ride_id', ride.id)
        .eq('reviewer_id', currentUser.id)
        
      if (existing && existing.length > 0) {
        alert("You have already submitted a review for this ride.")
        onReviewSubmitted()
        setLoading(false)
        return
      }

      const { error } = await supabase.from('ride_reviews').insert(reviewPayloads)
      if (error) throw error

      alert('Reviews submitted successfully!')
      onReviewSubmitted()
    } catch (err) {
      console.error(err)
      alert("Failed to submit reviews.")
    } finally {
      setLoading(false)
    }
  }

  const renderReviewForm = (targetId, title) => {
    const rev = reviewsState[targetId]
    if (!rev) return null

    return (
      <div key={targetId} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <h5 style={{ margin: '0 0 1rem 0' }}>Review for: {title}</h5>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={rev.didHappen} 
              onChange={e => handleChange(targetId, 'didHappen', e.target.checked)} 
            />
            {isCreator ? "Did this passenger show up?" : "Did this ride actually happen?"}
          </label>
        </div>

        {rev.didHappen && (
          <div style={{ marginBottom: '1rem' }}>
            <label>Rating (1-5): {rev.rating} Stars</label>
            <input 
              type="range" 
              min="1" max="5" 
              value={rev.rating} 
              onChange={e => handleChange(targetId, 'rating', e.target.value)} 
              style={{ width: '100%', marginTop: '0.5rem' }} 
            />
          </div>
        )}

        <textarea 
          className="input-field" 
          placeholder="Optional comments..." 
          value={rev.comment} 
          onChange={e => handleChange(targetId, 'comment', e.target.value)}
          style={{ minHeight: '60px', width: '100%' }}
        />
      </div>
    )
  }

  if (isCreator && approvedPassengers.length === 0) {
    return (
      <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <h4>Submit Reviews</h4>
        <p style={{ color: 'var(--text-muted)' }}>There were no approved passengers to review for this ride.</p>
        <button className="btn" onClick={onReviewSubmitted}>Acknowledge</button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
      <h4>Submit Feedback</h4>
      
      {isCreator ? (
        approvedPassengers.map(p => renderReviewForm(p.user_id, p.users?.name || 'Passenger'))
      ) : (
        renderReviewForm(ride.creator_id, ride.users?.name || 'Publisher')
      )}

      <button className="btn" onClick={handleSubmit} disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Submitting...' : 'Submit Review(s)'}
      </button>
    </div>
  )
}
