import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ReviewCard from './ReviewCard'

export default function ReviewList({ userId, reviewType }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && reviewType) {
      fetchReviews()
    }
  }, [userId, reviewType])

  const fetchReviews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ride_reviews')
      .select('*, users!reviewer_id(name, avatar_url)')
      .eq('reviewee_id', userId)
      .eq('review_type', reviewType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
    } else {
      setReviews(data || [])
    }
    setLoading(false)
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading reviews...</div>
  
  if (reviews.length === 0) return (
    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
      No reviews in this category yet.
    </div>
  )

  return (
    <div>
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
