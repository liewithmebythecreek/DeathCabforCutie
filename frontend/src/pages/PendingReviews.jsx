import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Clock, Star } from 'lucide-react'

export default function PendingReviews() {
  const { user } = useAuth()
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchPendingReviews()
  }, [user])

  const fetchPendingReviews = async () => {
    setLoading(true)
    try {
      // 1. Get all rides the user is involved in that are 'awaiting_reviews'
      // We need to check both rides they created AND rides they are an approved passenger on.
      
      // As Publisher
      const { data: publisherRides } = await supabase
        .from('rides')
        .select(`id, pickup_location_name, destination_name, departure_time`)
        .eq('creator_id', user.id)
        .eq('status', 'awaiting_reviews')

      // As Rider
      const { data: riderRequests, error: rErr } = await supabase
        .from('ride_requests')
        .select(`
          ride_id,
          rides!inner (
            id,
            pickup_location_name,
            destination_name,
            departure_time,
            creator_id,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .eq('rides.status', 'awaiting_reviews')

      const riderRides = riderRequests?.map(r => r.rides) || []

      // 2. Get reviews the user HAS ALREADY submitted for these types
      const { data: myReviews } = await supabase
        .from('ride_reviews')
        .select('ride_id, reviewee_id')
        .eq('reviewer_id', user.id)

      const myReviewMap = new Map()
      myReviews?.forEach(r => {
        if (!myReviewMap.has(r.ride_id)) myReviewMap.set(r.ride_id, new Set())
        myReviewMap.get(r.ride_id).add(r.reviewee_id)
      })

      const pending = []

      // Check Publisher pending (needs to review all approved passengers)
      for (const pr of publisherRides || []) {
        const { data: passengers } = await supabase
          .from('ride_requests')
          .select('user_id')
          .eq('ride_id', pr.id)
          .eq('status', 'approved')
        
        let hasPending = false
        passengers?.forEach(p => {
          if (!myReviewMap.get(pr.id)?.has(p.user_id)) hasPending = true
        })

        if (hasPending) {
          pending.push({ ...pr, role: 'Publisher' })
        }
      }

      // Check Rider pending (needs to review the publisher)
      for (const rr of riderRides || []) {
        if (!myReviewMap.get(rr.id)?.has(rr.creator_id)) {
          pending.push({ ...rr, role: 'Rider' })
        }
      }

      setPendingReviews(pending)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading pending reviews...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Pending Reviews</h2>

      {pendingReviews.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Star size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>You're all caught up!</h3>
          <p style={{ color: 'var(--text-muted)' }}>You have no pending reviews to submit.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {pendingReviews.map(ride => (
            <div key={ride.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: ride.role === 'Publisher' ? 'var(--primary)' : 'var(--accent)' }}>
                  As {ride.role}
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                  Action Required
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                  {ride.pickup_location_name}
                </div>
                <div style={{ borderLeft: '1px dashed var(--border)', height: '10px', marginLeft: '3px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <MapPin size={12} color="var(--accent)" style={{ marginLeft: '-2px' }} />
                  {ride.destination_name}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'auto' }}>
                <Clock size={14} />
                {new Date(ride.departure_time).toLocaleDateString()} at {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              <Link to={`/ride/${ride.id}`} className="btn" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', textAlign: 'center', background: 'var(--primary)' }}>
                Review Now
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
