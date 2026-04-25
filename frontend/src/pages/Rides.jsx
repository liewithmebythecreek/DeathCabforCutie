import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Users, Clock, IndianRupee, Search, ArrowLeftRight, X, Calendar } from 'lucide-react'
import ProfileCard from '../components/ProfileCard'
import LocationSearchInput from '../components/LocationSearchInput'
import { formatRideDateTime } from '../utils/dateUtils'

export default function Rides() {
  const [rides, setRides]   = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // ── Search state ──────────────────────────────────────────────────────────
  // Text shown in inputs
  const [fromText, setFromText] = useState('')
  const [toText,   setToText]   = useState('')
  const [timeQuery, setTimeQuery] = useState('')
  // Resolved location objects (with lat/lng when user picks from autocomplete)
  const [fromLoc, setFromLoc] = useState(null)
  const [toLoc,   setToLoc]   = useState(null)

  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetchRides()

    const channel = supabase
      .channel('rides-listing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => fetchRides())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, () => fetchRides())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          users!creator_id(name, rating, avatar_url, show_identity),
          drivers:assigned_driver_id(*),
          registered_vehicles:driver_id(*)
        `)
        .in('status', ['active', 'published'])
        .gt('available_seats', 0)
        .gt('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true })

      if (error) throw error
      setRides(data || [])
    } catch (err) {
      console.error('Error fetching rides:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const normalize = (s = '') => s.toLowerCase().trim()

  const filteredRides = rides.filter(ride => {
    if (!searched) return true

    const pickup = normalize(ride.pickup_location_name || ride.start_location || '')
    const dest   = normalize(ride.destination_name    || ride.end_location   || '')
    const from   = normalize(fromText)
    const to     = normalize(toText)

    if (from && !pickup.includes(from)) return false
    if (to   && !dest.includes(to))     return false

    if (timeQuery) {
      const rideTime = new Date(ride.departure_time)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      if (!rideTime.startsWith(timeQuery)) return false
    }

    return true
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearched(true)
  }

  const handleClear = () => {
    setFromText(''); setFromLoc(null)
    setToText('');   setToLoc(null)
    setTimeQuery('');
    setSearched(false)
  }

  const handleSwap = () => {
    const tmpText = fromText; const tmpLoc = fromLoc
    setFromText(toText);   setFromLoc(toLoc)
    setToText(tmpText);    setToLoc(tmpLoc)
  }

  const hasFilter = fromText || toText || timeQuery

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading rides…</div>

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Available Rickshaws</h2>
        <Link to="/create" className="btn" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
          Publish Ride
        </Link>
      </div>

      {/* ── Search Panel ─────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="glass-card rides-search-card"
        style={{ marginBottom: '1.5rem' }}
      >
        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Find a ride
        </p>

        {/* ── From row ── */}
        <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
          <LocationSearchInput
            label=""
            value={fromText}
            onChange={setFromText}
            onSelect={(loc) => { setFromLoc(loc); setFromText(loc.name) }}
            placeholder="From (pickup location)"
          />
        </div>

        {/* ── Swap button ── */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.1rem 0 0.4rem' }}>
          <button
            type="button"
            onClick={handleSwap}
            title="Swap locations"
            className="swap-btn"
          >
            <ArrowLeftRight size={14} color="var(--primary)" />
          </button>
        </div>

        {/* ── To row ── */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <LocationSearchInput
            label=""
            value={toText}
            onChange={setToText}
            onSelect={(loc) => { setToLoc(loc); setToText(loc.name) }}
            placeholder="To (destination)"
          />
        </div>

        {/* ── Departure time ── */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            Departure time (optional)
          </label>
          <input
            type="time"
            value={timeQuery}
            onChange={e => setTimeQuery(e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* ── Action row ── */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn" style={{ flex: 1, height: '48px', borderRadius: '12px', gap: '0.4rem' }}>
            <Search size={16} />
            Search Rides
          </button>
          {(hasFilter || searched) && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear filters"
              style={{ flexShrink: 0, background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Result hint ── */}
        {searched && (
          <p style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {filteredRides.length === 0
              ? '😕 No rides match your search.'
              : `✅ ${filteredRides.length} ride${filteredRides.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </form>

      {/* ── Ride Cards ───────────────────────────────────────────────────── */}
      {filteredRides.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <MapPin size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>{searched ? 'No rides match your search' : 'No rides currently available'}</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {searched ? 'Try adjusting the From / To fields.' : 'Be the first to share a rickshaw ride today!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredRides.map(ride => {
            const isOwn = user?.id === ride.creator_id
            const anonymizePublisher = !isOwn && ride.users?.show_identity === false
            const driverInfo = ride.external_driver || ride.drivers || ride.registered_vehicles

            return (
              <div key={ride.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <ProfileCard
                    user={{ id: ride.creator_id, name: ride.users?.name || 'Fellow Student', rating: ride.users?.rating, avatar_url: ride.users?.avatar_url }}
                    anonymize={anonymizePublisher}
                  />
                  {ride.vehicle_type && (
                    <div style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap', background: ride.vehicle_type === 'cab' ? 'rgba(99,102,241,0.15)' : 'rgba(234,179,8,0.15)', color: ride.vehicle_type === 'cab' ? '#818cf8' : '#ca8a04', border: `1px solid ${ride.vehicle_type === 'cab' ? 'rgba(99,102,241,0.3)' : 'rgba(234,179,8,0.3)'}` }}>
                      {ride.vehicle_type === 'cab' ? '🚕 Cab' : '🛺 Auto'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                    {ride.pickup_location_name}
                  </div>
                  <div style={{ borderLeft: '1px dashed var(--border)', height: '10px', marginLeft: '3px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <MapPin size={12} color="var(--accent)" style={{ marginLeft: '-2px', flexShrink: 0 }} />
                    {ride.destination_name}
                  </div>
                </div>

                {driverInfo && (
                  <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.75rem', fontWeight: 'bold' }}>DRIVER DETAILS</div>
                    <div style={{ fontWeight: '500' }}>{driverInfo.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{driverInfo.vehicle_number} ({driverInfo.vehicle_type})</div>
                    <div style={{ color: 'var(--text-muted)' }}>📞 {driverInfo.mobile_number}</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    <span style={{ fontWeight: ride.departure_time && new Date(ride.departure_time) - new Date() < 3600000 ? '700' : '400' }}>
                      {formatRideDateTime(ride.departure_time)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={14} />
                    {ride.available_seats} / {ride.max_occupancy} Seats
                  </div>
                </div>

                {ride.total_price > 0 && (() => {
                  const joined = ride.max_occupancy - ride.available_seats
                  const occupants = joined + 1
                  const perPerson = (ride.total_price / Math.max(1, occupants)).toFixed(2)
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                        <IndianRupee size={13} />
                        Total: <strong style={{ color: 'var(--text)' }}>₹{ride.total_price}</strong>
                      </div>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{perPerson}/person</div>
                    </div>
                  )
                })()}

                <Link to={`/ride/${ride.id}`} className="btn" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>
                  View &amp; Join
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
