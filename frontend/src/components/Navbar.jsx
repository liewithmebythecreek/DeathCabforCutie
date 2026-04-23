import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Bell, Menu, X, Home, PlusCircle, ClipboardList, History, User, Shield } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { unreadCount } = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    setSidebarOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  // ── Nav link helper ────────────────────────────────────────────────────────
  const NavItem = ({ to, icon: Icon, label, badge }) => (
    <NavLink
      to={to}
      onClick={closeSidebar}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' sidebar-nav-active' : ''}`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {badge > 0 && (
        <span className="sidebar-badge">{badge > 9 ? '9+' : badge}</span>
      )}
    </NavLink>
  )

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP NAVBAR (hidden on mobile via CSS)
      ══════════════════════════════════════════════════════════════════ */}
      <nav className="navbar desktop-navbar">
        <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)', textDecoration: 'none' }}>
          CampusRides
        </Link>

        <div className="nav-links" style={{ alignItems: 'center' }}>
          {role === 'student' && (
            <>
              <NavLink to="/" end style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none', fontWeight: isActive ? '600' : '400' })}>Available Rides</NavLink>
              {user?.profile_completed ? (
                <NavLink to="/create" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none', fontWeight: isActive ? '600' : '400' })}>Publish Ride</NavLink>
              ) : (
                <Link to="/profile/settings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} title="Complete your profile first">Publish Ride 🔒</Link>
              )}
              <NavLink to="/pending-reviews" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none', fontWeight: isActive ? '600' : '400' })}>Pending Reviews</NavLink>
              <NavLink to="/history" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none', fontWeight: isActive ? '600' : '400' })}>History</NavLink>
              <NavLink to={`/profile/${user?.id || ''}`} style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none', fontWeight: isActive ? '600' : '400' })}>Profile</NavLink>

              {/* Notification Bell */}
              <Link to="/notifications" title="Notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: 'white', borderRadius: '999px', fontSize: '0.65rem', fontWeight: '800', minWidth: '17px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1 }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {role === 'driver' && (
            <>
              <Link to="/driver-dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {user?.name || 'Driver'} · {user?.vehicle_type || 'Vehicle'}
              </span>
            </>
          )}

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', width: 'auto' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE HEADER BAR (visible only on mobile via CSS)
      ══════════════════════════════════════════════════════════════════ */}
      <header className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/" style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--primary)', textDecoration: 'none' }}>
          CampusRides
        </Link>

        {/* Notification bell always visible on mobile header */}
        <Link to="/notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)', marginLeft: 'auto' }}>
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="mobile-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR DRAWER
      ══════════════════════════════════════════════════════════════════ */}
      {/* Dim overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar-drawer${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Sidebar header */}
        <div className="sidebar-header">
          <span style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--primary)' }}>CampusRides</span>
          <button className="hamburger-btn" onClick={closeSidebar} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        {/* User info chip */}
        {user && (
          <div className="sidebar-user-chip">
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(36,138,82,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary)', fontSize: '1rem', flexShrink: 0 }}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'User'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
        )}

        <div className="sidebar-divider" />

        {/* Nav links */}
        <nav className="sidebar-nav">
          {role === 'student' && (
            <>
              <NavItem to="/" icon={Home} label="Available Rides" />
              {user?.profile_completed
                ? <NavItem to="/create" icon={PlusCircle} label="Publish Ride" />
                : (
                  <div className="sidebar-nav-item sidebar-nav-locked" title="Complete your profile first">
                    <PlusCircle size={18} />
                    <span>Publish Ride</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>🔒</span>
                  </div>
                )
              }
              <NavItem to="/pending-reviews" icon={ClipboardList} label="Pending Reviews" />
              <NavItem to="/history" icon={History} label="History" />
              <NavItem to={`/profile/${user?.id || ''}`} icon={User} label="Profile" />
              <NavItem to="/notifications" icon={Bell} label="Notifications" badge={unreadCount} />
              {user?.email === '2023aib1015@iitrpr.ac.in' && (
                <NavItem to="/admin/drivers" icon={Shield} label="Admin" />
              )}
            </>
          )}

          {role === 'driver' && (
            <>
              <NavItem to="/driver-dashboard" icon={LayoutDashboard} label="Dashboard" />
            </>
          )}
        </nav>

        <div className="sidebar-divider" />

        {/* Logout */}
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <LogOut size={18} /> Sign Out
        </button>
      </aside>
    </>
  )
}
