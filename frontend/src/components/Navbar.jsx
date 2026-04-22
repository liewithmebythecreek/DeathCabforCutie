import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Bell } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { unreadCount } = useNotifications()

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
        {/* Student links */}
        {role === 'student' && (
          <>
            <Link to="/">Available Rides</Link>
            {user?.profile_completed ? (
              <Link to="/create">Publish Ride</Link>
            ) : (
              <Link to="/profile/settings" style={{ color: 'var(--text-muted)' }} title="Please complete your profile first">Publish Ride (Locked)</Link>
            )}
            <Link to="/pending-reviews">Pending Reviews</Link>
            <Link to="/history">History</Link>
            <Link to={`/profile/${user?.id || ''}`}>Profile</Link>

            {/* Notification Bell */}
            <Link
              to="/notifications"
              title="Notifications"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  minWidth: '17px',
                  height: '17px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  lineHeight: 1,
                  boxShadow: '0 0 0 2px var(--bg)',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </>
        )}

        {/* Driver links */}
        {role === 'driver' && (
          <>
            <Link to="/driver-dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LayoutDashboard size={15} /> Dashboard
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {user?.name || 'Driver'} ({user?.phone}) · {user?.vehicle_type || 'Vehicle'} ({user?.vehicle_number || 'N/A'})
            </span>
          </>
        )}

        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  )
}
