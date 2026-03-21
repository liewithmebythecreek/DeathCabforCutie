import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
        CampusRides
      </div>
      <div className="nav-links" style={{ alignItems: 'center' }}>
        <Link to="/">Available Rides</Link>
        {user?.profile_completed ? (
          <Link to="/create">Publish Ride</Link>
        ) : (
          <Link to="/profile/settings" style={{ color: 'var(--text-muted)' }} title="Please complete your profile first">Publish Ride (Locked)</Link>
        )}
        <Link to="/pending-reviews">Pending Reviews</Link>
        <Link to={`/profile/${user?.id || ''}`}>Profile</Link>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  )
}
