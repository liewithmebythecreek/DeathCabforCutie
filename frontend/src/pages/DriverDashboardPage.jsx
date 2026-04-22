import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DriverRideCard from '../components/DriverRideCard'
import { Car, Bell, RefreshCw, CheckCircle, Power, Star, AlertTriangle } from 'lucide-react'
import { formatStarBreakdown, getDriverRatingBreakdown } from '../utils/reviewEngine'
import { PRIORITY_CONFIG, isHighPriority } from '../utils/priorityEngine'

const TABS = [
  { id: 'new', label: 'New Requests', icon: Bell, statuses: ['pending_driver'] },
  { id: 'negotiating', label: 'Negotiations', icon: RefreshCw, statuses: ['negotiating', 'price_proposed'] },
  { id: 'accepted', label: 'Accepted Rides', icon: CheckCircle, statuses: ['published', 'active'] },
  { id: 'reviews', label: 'My Reviews', icon: Star, statuses: [] },
]

export default function DriverDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('new')
  const [priorityFilter, setPriorityFilter] = useState('ALL') // 'ALL' | 'PRIORITY' | 'EMERGENCY'
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [driverStatus, setDriverStatus] = useState('available')
  const [driverVehicleType, setDriverVehicleType] = useState('autorickshaw')
  
  // Review specific state
  const [driverStats, setDriverStats] = useState(null)
  const [myReviews, setMyReviews] = useState([])

  // ── Refs ──────────────────────────────────────────────────────────────────
  // legacyIdRef: resolved once (undefined = not yet fetched, null = no legacy ID)
  const legacyIdRef = useRef(undefined)
  // userRef: always points at the latest user so async callbacks don't go stale
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])
  // driverVehicleTypeRef: keeps vehicle_type readable inside stale realtime closures
  const driverVehicleTypeRef = useRef('autorickshaw')
  useEffect(() => { driverVehicleTypeRef.current = driverVehicleType }, [driverVehicleType])
  // doFetchRef: always points at latest doFetch so realtime closures never go stale
  const doFetchRef = useRef(null)

  // ── Core fetch (plain async fn, called from effects only) ────────────────
  const doFetch = async (userId, isBackground = false) => {
    if (!userId) return
    if (!isBackground) setLoading(true)

    // Resolve legacy vehicle ID once per session
    if (legacyIdRef.current === undefined) {
      const u = userRef.current
      const mobile = u?.phone || u?.mobile_number
      if (mobile) {
        const digits = mobile.replace(/\D/g, '')
        const noCode = digits.startsWith('91') ? digits.slice(2) : digits
        const { data } = await supabase
          .from('registered_vehicles')
          .select('id')
          .in('mobile_number', [`+91${noCode}`, noCode, mobile])
          .maybeSingle()
        legacyIdRef.current = data?.id ?? null
      } else {
        legacyIdRef.current = null
      }
    }

    const legacyId = legacyIdRef.current

    // Fetch driver profile first to get vehicle_type for filtering
    const { data: driverProfileData } = await supabase
      .from('drivers')
      .select('vehicle_type')
      .eq('id', userId)
      .single()
    const myVehicleType = driverProfileData?.vehicle_type || 'autorickshaw'

    // Rides where the driver is already assigned (any status)
    let assignedArgs = `assigned_driver_id.eq.${userId}`
    if (legacyId) assignedArgs += `,driver_id.eq.${legacyId}`

    const [{ data, error }, { data: offersData }, { data: reviewsData }, { data: driverData }] = await Promise.all([
      supabase
        .from('rides')
        .select(`*, users!creator_id(name, avatar_url, rating)`)
        // Return rides that are: assigned to this driver OR open marketplace matching vehicle type
        .or(`${assignedArgs},and(status.eq.pending_driver,vehicle_type.eq.${myVehicleType})`)
        .not('status', 'in', '("cancelled","completed","awaiting_reviews","rejected")')
        .order('created_at', { ascending: false }),
      supabase
        .from('ride_offers')
        .select('*')
        .eq('driver_id', userId),
      supabase
        .from('ride_reviews')
        .select('*, users!reviewer_id(name, avatar_url)')
        .eq('driver_id', userId)
        .eq('review_type', 'rider_to_driver')
        .order('created_at', { ascending: false }),
      supabase
        .from('drivers')
        .select('status, average_rating, total_reviews, vehicle_type')
        .eq('id', userId)
        .single()
    ])

    if (!error) {
      const myOffers = offersData || []
      const enhanced = (data || []).map(r => {
        const myOffer = myOffers.find(o => o.ride_id === r.id)
        let meta = r.status
        if (myOffer && r.status === 'pending_driver') {
          if (['pending_student', 'pending_driver'].includes(myOffer.status)) meta = 'negotiating'
          if (['rejected_by_student', 'rejected_by_driver', 'rejected_system'].includes(myOffer.status)) meta = 'rejected'
        }
        return { ...r, driverMetaStatus: meta, offer: myOffer }
      })
      setRides(enhanced)
    }

    if (reviewsData) setMyReviews(reviewsData)
    if (driverData) {
      setDriverStatus(driverData.status)
      setDriverVehicleType(driverData.vehicle_type || 'autorickshaw')
      setDriverStats({ average_rating: driverData.average_rating, total_reviews: driverData.total_reviews })
    }

    if (!isBackground) setLoading(false)
  }

  // Keep ref always pointing at latest doFetch
  doFetchRef.current = doFetch

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    legacyIdRef.current = undefined  // reset cache when user changes

    // Async IIFE keeps setState deferred (not synchronous in effect body)
    ;(async () => {
      await doFetchRef.current(user.id, false)
    })()
  }, [user?.id])

  // ── Realtime subscription ─────────────────────────────────────────────────
  // All callbacks use refs so they're never stale closures.
  useEffect(() => {
    if (!user?.id) return
    const userId = user.id

    const triggerFetch = () => {
      doFetchRef.current?.(userId, true)
    }

    // Play a short beep via Web Audio API for high-priority alerts
    const playAlert = (isEmergency) => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.frequency.value = isEmergency ? 880 : 660
        oscillator.type = 'sine'
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.6)
        // For emergency, play a second beep
        if (isEmergency) {
          const o2 = ctx.createOscillator()
          const g2 = ctx.createGain()
          o2.connect(g2); g2.connect(ctx.destination)
          o2.frequency.value = 1100; o2.type = 'sine'
          g2.gain.setValueAtTime(0.4, ctx.currentTime + 0.7)
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3)
          o2.start(ctx.currentTime + 0.7); o2.stop(ctx.currentTime + 1.3)
        }
      } catch (_) { /* Web Audio not available */ }
    }

    const channel = supabase
      .channel(`driver-dashboard-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        (payload) => {
          const myType = driverVehicleTypeRef.current || 'autorickshaw'
          const row = payload.new
          const checkMatch = (r) => {
            if (!r) return false
            if (r.assigned_driver_id === userId) return true
            if (legacyIdRef.current && r.driver_id === legacyIdRef.current) return true
            if (r.status === 'pending_driver' && r.vehicle_type === myType) return true
            return false
          }
          if (checkMatch(payload.old) || checkMatch(row)) {
            triggerFetch()
            // High-priority alert: auto-focus New Requests + play sound
            if (
              payload.eventType === 'INSERT' &&
              row?.status === 'pending_driver' &&
              row?.vehicle_type === myType &&
              (row?.priority_score || 0) >= 4
            ) {
              setActiveTab('new')
              setPriorityFilter(row.priority_type === 'EMERGENCY' ? 'EMERGENCY' : 'PRIORITY')
              playAlert(row.priority_type === 'EMERGENCY')
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ride_offers', filter: `driver_id=eq.${userId}` },
        triggerFetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ride_reviews', filter: `driver_id=eq.${userId}` },
        triggerFetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers', filter: `id=eq.${userId}` },
        triggerFetch
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') triggerFetch()
      })

    // Synchronous cleanup — no async gap where channel leaks can happen
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])



  const toggleStatus = async () => {
    const newStatus = driverStatus === 'available' ? 'offline' : 'available'
    const { error } = await supabase
      .from('drivers')
      .update({ status: newStatus })
      .eq('id', user.id)
    if (!error) setDriverStatus(newStatus)
  }

  const dismissedRides = JSON.parse(localStorage.getItem('dismissed_rides') || '[]')
  // Hide open marketplace requests from offline drivers, and auto-expire ancient requests
  const visibleRides = rides.filter(r => {
    if (r.driverMetaStatus === 'rejected') return false
    if (r.status === 'pending_driver' && driverStatus === 'offline') return false
    if (r.status === 'pending_driver' && dismissedRides.includes(r.id)) return false
    // automatically expire requests if their departure time has passed in the past 1 minute
    if (r.status === 'pending_driver' && r.departure_time && new Date(r.departure_time) < new Date()) {
      return false
    }
    return true
  })

  const activeStatuses = TABS.find(t => t.id === activeTab)?.statuses || []

  // Sort by priority_score DESC, then created_at ASC (older first for equal priority)
  const sortedByPriority = (arr) => [...arr].sort((a, b) => {
    const scoreDiff = (b.priority_score || 0) - (a.priority_score || 0)
    if (scoreDiff !== 0) return scoreDiff
    return new Date(a.created_at) - new Date(b.created_at)
  })

  const filteredRides = (() => {
    let base = visibleRides.filter(r => activeStatuses.includes(r.driverMetaStatus))
    if (activeTab === 'new') {
      if (priorityFilter === 'PRIORITY') base = base.filter(r => (r.priority_score || 0) >= 2)
      if (priorityFilter === 'EMERGENCY') base = base.filter(r => r.priority_type === 'EMERGENCY')
      base = sortedByPriority(base)
    }
    return base
  })()

  const emergencyCount = visibleRides.filter(r =>
    r.driverMetaStatus === 'pending_driver' && r.priority_type === 'EMERGENCY'
  ).length

  const countFor = (tab) => {
    if (tab.id === 'reviews') return myReviews.length
    return visibleRides.filter(r => tab.statuses.includes(r.driverMetaStatus)).length
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>Driver Dashboard</h2>
            {driverStats && driverStats.total_reviews > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(251,191,36,0.15)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                <Star size={14} fill="currentColor" />
                {driverStats.average_rating.toFixed(1)} 
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '0.2rem' }}>({driverStats.total_reviews})</span>
              </div>
            )}
            <div style={{
              padding: '0.2rem 0.7rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700',
              background: driverVehicleType === 'cab' ? 'rgba(99,102,241,0.15)' : 'rgba(234,179,8,0.15)',
              color: driverVehicleType === 'cab' ? '#818cf8' : '#ca8a04',
              border: `1px solid ${driverVehicleType === 'cab' ? 'rgba(99,102,241,0.3)' : 'rgba(234,179,8,0.3)'}`,
            }}>
              {driverVehicleType === 'cab' ? '🚕 Cab' : '🛺 Auto'}
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Welcome back, {user?.name || 'Driver'}
          </p>
        </div>
        <button
          onClick={toggleStatus}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            border: '2px solid',
            borderColor: driverStatus === 'available' ? '#22c55e' : 'rgba(255,255,255,0.2)',
            background: driverStatus === 'available' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            color: driverStatus === 'available' ? '#22c55e' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem'
          }}
        >
          <Power size={14} />
          {driverStatus === 'available' ? 'Online' : 'Offline'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="responsive-grid-3" style={{ marginBottom: '2rem' }}>
        {TABS.slice(0,3).map(tab => {
          const Icon = tab.icon
          const count = countFor(tab)
          const isEmergencyTab = tab.id === 'new' && emergencyCount > 0
          return (
            <div key={tab.id} className="glass-card" style={{
              padding: '1rem', textAlign: 'center',
              border: isEmergencyTab ? '1px solid rgba(239,68,68,0.4)' : undefined,
              background: isEmergencyTab ? 'rgba(239,68,68,0.05)' : undefined,
            }}>
              <Icon size={20} color={isEmergencyTab ? '#ef4444' : 'var(--primary)'} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tab.label}</div>
              {isEmergencyTab && (
                <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '700', marginTop: '0.25rem' }}>
                  🚨 {emergencyCount} Emergency
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const count = countFor(tab)
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.9rem',
                marginBottom: '-1px',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              {tab.label}
              {count > 0 && tab.id !== 'reviews' && (
                <span style={{
                  background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  borderRadius: '999px',
                  padding: '0 6px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Priority filter pills — only shown in New Requests tab */}
      {activeTab === 'new' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>FILTER:</span>
          {[
            { id: 'ALL',       label: 'All',           style: {} },
            { id: 'PRIORITY',  label: '⚡ Priority',    style: { color: '#f59e0b', border: 'rgba(245,158,11,0.4)' } },
            { id: 'EMERGENCY', label: '🚨 Emergency',   style: { color: '#ef4444', border: 'rgba(239,68,68,0.4)' } },
          ].map(f => {
            const active = priorityFilter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setPriorityFilter(f.id)}
                style={{
                  padding: '0.3rem 0.9rem',
                  borderRadius: '999px',
                  border: `1.5px solid ${active ? (f.style.border || 'var(--primary)') : 'var(--border)'}`,
                  background: active ? (f.id === 'EMERGENCY' ? 'rgba(239,68,68,0.12)' : f.id === 'PRIORITY' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)') : 'transparent',
                  color: active ? (f.style.color || 'var(--primary)') : 'var(--text-muted)',
                  fontWeight: active ? '700' : '400',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
                {f.id === 'EMERGENCY' && emergencyCount > 0 && (
                  <span style={{ marginLeft: '4px', background: '#ef4444', color: 'white', borderRadius: '999px', padding: '0 5px', fontSize: '0.7rem', fontWeight: '800' }}>
                    {emergencyCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Ride Cards / Reviews Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      ) : activeTab === 'reviews' ? (
        myReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-card">
            <Star size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ margin: 0 }}>You don't have any reviews yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myReviews.map(review => (
              <div key={review.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     {review.users?.avatar_url && (
                        <img src={review.users.avatar_url} alt="Rider" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                     )}
                     {review.users?.name || 'Passenger'}
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={14} fill={s <= review.rating ? '#fbbf24' : 'none'} color={s <= review.rating ? '#fbbf24' : 'var(--border)'} />
                    ))}
                  </div>
                </div>
                
                {review.is_auto_generated && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '0.5rem' }}>
                    AUTO-PENALTY (CANCELLATION)
                  </div>
                )}

                {review.tags && review.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: review.comment ? '0.75rem' : '0' }}>
                    {review.tags.map(tag => (
                      <span key={tag} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {review.comment && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                    "{review.comment}"
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredRides.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-card">
          <Car size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0 }}>
            {activeTab === 'new' && priorityFilter !== 'ALL'
              ? `No ${priorityFilter.toLowerCase()} priority rides right now.`
              : activeTab === 'new' ? 'No new ride requests at the moment.'
              : activeTab === 'negotiating' ? 'No active negotiations.'
              : 'No accepted rides yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredRides.map(ride => (
            <DriverRideCard
              key={ride.id}
              ride={ride}
              onUpdate={() => doFetch(user?.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
