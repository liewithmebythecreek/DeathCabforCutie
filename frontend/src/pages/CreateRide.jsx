import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

// Fix default leaf icon issues
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const LocationMarker = ({ position, setPosition, label }) => {
  useMapEvents({
    click(e) {
      if (label === 'pickup') {
        setPosition(p => ({ ...p, pickup: e.latlng }))
      } else if (label === 'destination') {
        setPosition(p => ({ ...p, destination: e.latlng }))
      }
    },
  })
  return position ? <Marker position={position} /> : null
}

export default function CreateRide() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [pickupName, setPickupName] = useState('')
  const [destName, setDestName] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [occupancy, setOccupancy] = useState(3)
  
  const [positions, setPositions] = useState({ pickup: null, destination: null })
  const [activeSelect, setActiveSelect] = useState('pickup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const departureDate = new Date(departureTime)
    if (departureDate <= new Date()) {
      setError("Departure time must be in the future.")
      return
    }

    if (!user?.profile_completed) {
      setError("You must complete your profile (Name and Avatar) before publishing rides.")
      return
    }

    // New validation for empty ride details
    if (!pickupName.trim() || !destName.trim() || !departureTime) {
      setError("Please fill in all ride details (Pickup Name, Destination Name, Departure Time).")
      return
    }

    if (!positions.pickup || !positions.destination) {
      setError("Please click on the map to set both pickup and destination markers.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error: insertError } = await supabase.from('rides').insert([{
        creator_id: user.id,
        pickup_location_name: pickupName,
        pickup_lat: positions.pickup.lat,
        pickup_lng: positions.pickup.lng,
        destination_name: destName,
        destination_lat: positions.destination.lat,
        destination_lng: positions.destination.lng,
        departure_time: new Date(departureTime).toISOString(),
        max_occupancy: parseInt(occupancy),
        available_seats: parseInt(occupancy),
        status: 'active'
      }]).select().single()

      if (insertError) throw insertError

      navigate(`/ride/${data.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Publish Rickshaw Ride</h2>
      </div>

      {!user?.profile_completed && (
        <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          <strong>Profile Incomplete:</strong> You must set your Name and Avatar on the Profile page before you can publish a ride.
        </div>
      )}

      {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', opacity: user?.profile_completed ? 1 : 0.5, pointerEvents: user?.profile_completed ? 'auto' : 'none' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pickup Location Name</label>
            <input 
              required 
              type="text" 
              className="input-field" 
              value={pickupName} 
              onChange={e => setPickupName(e.target.value)} 
              placeholder="e.g. Main Gate" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Destination Name</label>
            <input 
              required 
              type="text" 
              className="input-field" 
              value={destName} 
              onChange={e => setDestName(e.target.value)} 
              placeholder="e.g. Science Block" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Departure Time</label>
            <input 
              required 
              type="datetime-local" 
              className="input-field" 
              value={departureTime} 
              onChange={e => setDepartureTime(e.target.value)} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Available Seats (Rickshaw Capacity)</label>
            <input 
              required 
              type="number" 
              min="1" 
              max="6" 
              className="input-field" 
              value={occupancy} 
              onChange={e => setOccupancy(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Publishing...' : 'Publish Ride'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              className={activeSelect === 'pickup' ? 'btn' : 'btn btn-secondary'} 
              style={{ flex: 1, padding: '0.5rem' }}
              onClick={() => setActiveSelect('pickup')}
            >
              Set Pickup
            </button>
            <button 
              type="button"
              className={activeSelect === 'destination' ? 'btn' : 'btn btn-secondary'} 
              style={{ flex: 1, padding: '0.5rem' }}
              onClick={() => setActiveSelect('destination')}
            >
              Set Destination
            </button>
          </div>
          <div style={{ flex: 1, minHeight: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {activeSelect === 'pickup' && <LocationMarker position={positions.pickup} setPosition={setPositions} label="pickup" />}
              {activeSelect === 'destination' && <LocationMarker position={positions.destination} setPosition={setPositions} label="destination" />}
              {positions.pickup && activeSelect !== 'pickup' && <Marker position={positions.pickup} opacity={0.5} />}
              {positions.destination && activeSelect !== 'destination' && <Marker position={positions.destination} opacity={0.5} />}
            </MapContainer>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Click on the map to place the {activeSelect} marker.
          </p>
        </div>
      </div>
    </div>
  )
}
