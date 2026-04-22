import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Star, MapPin, Clock, Users, User as UserIcon, Calendar, Settings, IndianRupee, EyeOff } from 'lucide-react'
import ReviewList from '../components/ReviewList'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePublic() {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [activeRides, setActiveRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('as_rider') // 'as_rider' | 'as_publisher'

  useEffect(() => {
    fetchProfileData()
  }, [id])

  // Real-time: refresh whenever rides or requests change for this user
  useEffect(() => {
    const channel = supabase
      .channel(`profile-public-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' },
        () => fetchProfileData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' },
        () => fetchProfileData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id])

  const fetchProfileData = async () => {
    setLoading(true)
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      if (userError) throw userError
      setProfile(userData)

      const ACTIVE_STATUSES = ['published', 'active', 'pending_driver', 'negotiating', 'price_proposed']

      // 1. Rides they published as creator
      const { data: createdData } = await supabase
        .from('rides')
        .select('*')
        .eq('creator_id', id)
        .in('status', ACTIVE_STATUSES)

      // 2. Rides they joined as an approved passenger
      const { data: requestData } = await supabase
        .from('ride_requests')
        .select('rides!inner(*)')
        .eq('user_id', id)
        .eq('status', 'approved')

      const joinedRides = (requestData || [])
        .map(r => r.rides)
        .filter(r => ACTIVE_STATUSES.includes(r.status))

      // Merge + deduplicate by ride id, sort soonest first
      const merged = [...(createdData || []), ...joinedRides]
      const unique = Array.from(new Map(merged.map(r => [r.id, r])).values())
      unique.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time))
      setActiveRides(unique)

    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</div>
  if (!profile) return <div style={{ textAlign: 'center', padding: '2rem' }}>User not found</div>

  // Privacy: anonymize when the profile owner has opted out AND the viewer is someone else
  const isOwnProfile = user?.id === id
  const anonymize    = !isOwnProfile && profile.show_identity === false

  const displayName = anonymize ? 'User' : profile.name

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Profile Hero Card ───────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '1.25rem',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>

        {/* Settings icon — top-right */}
        {user?.id === id && (
          <Link
            to="/profile/settings"
            style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)', lineHeight: 0 }}
            title="Edit Profile"
          >
            <Settings size={20} />
          </Link>
        )}

        {/* Avatar */}
        <div style={{
          flexShrink: 0,
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: anonymize ? 'rgba(0,0,0,0.08)' : 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          color: anonymize ? 'var(--text-muted)' : 'white',
          boxShadow: '0 0 0 3px rgba(36,138,82,0.15), 0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {!anonymize && profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <UserIcon size={32} />
          )}
        </div>

        {/* Text block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0, paddingRight: user?.id === id ? '1.75rem' : '0' }}>

          {/* Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: 1.2 }}>
              {displayName}
            </span>
            {anonymize && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.68rem', color: 'var(--text-muted)',
                background: 'rgba(0,0,0,0.05)', padding: '0.15rem 0.5rem',
                borderRadius: '6px', border: '1px solid var(--border)', fontWeight: '500',
                whiteSpace: 'nowrap',
              }}>
                <EyeOff size={10} /> Hidden
              </span>
            )}
          </div>

          {/* Stats — single compact line */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.875rem', color: 'var(--text-muted)',
            flexWrap: 'nowrap',
          }}>
            <Star size={13} fill="#fbbf24" color="#fbbf24" />
            <span style={{ fontWeight: '700', color: '#b45309' }}>
              {profile.rating ? profile.rating.toFixed(1) : '—'}
            </span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{profile.total_reviews || 0} reviews</span>
          </div>

          {/* Member since */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.78rem', color: 'var(--text-muted)',
          }}>
            <Calendar size={12} />
            <span>
              Joined {new Date(profile.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </span>
          </div>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Active Rides Section */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Active Rides with {displayName.split(' ')[0]}</h3>
          {activeRides.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No active rides at the moment.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {activeRides.map(ride => (
                <div key={ride.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} />
                      {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={14} />
                      {ride.available_seats} / {ride.max_occupancy}
                    </div>
                  </div>

                  {ride.total_price > 0 && (() => {
                    const joined = ride.max_occupancy - ride.available_seats
                    const occupants = joined + 1
                    const perPerson = (ride.total_price / Math.max(1, occupants)).toFixed(2)
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'rgba(99,102,241,0.12)', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><IndianRupee size={12} /> Total: ₹{ride.total_price}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{perPerson}/person</span>
                      </div>
                    )
                  })()}

                  <Link to={`/ride/${ride.id}`} className="btn" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                    View Ride
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Reviews</h3>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('as_rider')} 
              style={{ background: 'none', border: 'none', color: activeTab === 'as_rider' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'as_rider' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem' }}
            >
              Reviews as Rider
            </button>
            <button 
              onClick={() => setActiveTab('as_publisher')} 
              style={{ background: 'none', border: 'none', color: activeTab === 'as_publisher' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'as_publisher' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem' }}
            >
              Reviews as Publisher
            </button>
          </div>
          
          <ReviewList userId={id} reviewType={activeTab === 'as_rider' ? 'publisher_review' : 'rider_review'} />
        </div>

      </div>

    </div>
  )
}
