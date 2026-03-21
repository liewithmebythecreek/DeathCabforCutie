import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function LeaveRideButton({ rideId, requestId, publisherId, passengerId, onLeft }) {
  const [loading, setLoading] = useState(false)

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this ride? This will negatively affect your rating.")) return
    
    setLoading(true)
    try {
      // 1. Update request status to cancelled
      await supabase.from('ride_requests').update({ status: 'cancelled' }).eq('id', requestId)
      
      // Seat increment is now handled automatically by DB trigger trg_update_ride_seats
      
      // 3. Insert automatic negative review from publisher
      await supabase.from('ride_reviews').upsert([{
        ride_id: rideId,
        reviewer_id: publisherId, // publisher is the reviewer
        reviewee_id: passengerId, // passenger is the reviewee
        review_type: 'publisher_review',
        did_ride_happen: false,
        rating: 1,
        comment: 'Passenger cancelled participation.'
      }], { onConflict: 'ride_id, reviewer_id, reviewee_id' })
      
      onLeft()
    } catch (err) {
      console.error(err)
      alert("Failed to leave ride.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className="btn" style={{ background: '#ef4444', marginTop: '1rem' }} onClick={handleLeave} disabled={loading}>
      {loading ? 'Leaving...' : 'Leave Ride'}
    </button>
  )
}
