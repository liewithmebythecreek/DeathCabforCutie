import React, { useState } from 'react'
import { Bell, CheckCircle, XCircle, Car, UserPlus, Check, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../contexts/NotificationContext'
import { NOTIF_TYPES } from '../utils/notificationService'

// ── Time formatting ───────────────────────────────────────────
function timeAgo(dateStr) {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1)  return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24)  return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7)  return `${diffDays}d ago`
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function groupByDay(notifications) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups = {}
  notifications.forEach(n => {
    const d = new Date(n.created_at)
    d.setHours(0, 0, 0, 0)
    let label
    if (d.getTime() === today.getTime())     label = 'Today'
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  })
  return groups
}

// ── Icon + colour per type ────────────────────────────────────
const TYPE_META = {
  [NOTIF_TYPES.JOIN_REQUEST]:    { Icon: UserPlus,     color: '#6366f1', bg: 'rgba(99,102,241,0.15)',  emoji: '🔔' },
  [NOTIF_TYPES.JOIN_ACCEPTED]:   { Icon: CheckCircle,  color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   emoji: '✅' },
  [NOTIF_TYPES.JOIN_REJECTED]:   { Icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   emoji: '❌' },
  [NOTIF_TYPES.JOIN_CONFIRMED]:  { Icon: CheckCircle,  color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   emoji: '✅' },
  [NOTIF_TYPES.DRIVER_ASSIGNED]: { Icon: Car,          color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  emoji: '🚗' },
}

// ── Single notification row ───────────────────────────────────
function NotifRow({ notif }) {
  const { markRead, deleteNotification } = useNotifications()
  const navigate = useNavigate()
  const meta = TYPE_META[notif.type] || { Icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.15)', emoji: '🔔' }
  const { Icon } = meta

  const handleClick = () => {
    if (!notif.is_read) markRead(notif.id)
    if (notif.ride_id) navigate(`/ride/${notif.ride_id}`)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        cursor: notif.ride_id ? 'pointer' : 'default',
        background: notif.is_read ? 'transparent' : 'rgba(99,102,241,0.06)',
        border: notif.is_read ? '1px solid transparent' : '1px solid rgba(99,102,241,0.15)',
        transition: 'background 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(99,102,241,0.06)' }}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#6366f1',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: '42px', height: '42px', borderRadius: '50%',
        background: meta.bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={meta.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: notif.is_read ? '500' : '700',
          fontSize: '0.9rem',
          color: 'var(--text)',
          marginBottom: '0.2rem',
        }}>
          {notif.title}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {notif.message}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', opacity: 0.7 }}>
          {timeAgo(notif.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignSelf: 'center' }}
           onClick={e => e.stopPropagation()}>
        {!notif.is_read && (
          <button
            onClick={() => markRead(notif.id)}
            title="Mark as read"
            style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
              color: '#22c55e', borderRadius: '8px', padding: '0.3rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={() => deleteNotification(notif.id)}
          title="Delete"
          style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', borderRadius: '8px', padding: '0.3rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [filter, setFilter] = useState('all') // 'all' | 'unread'

  const visible = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const grouped = groupByDay(visible)
  const groupLabels = Object.keys(grouped)

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={22} color="var(--primary)" />
            Notifications
            {unreadCount > 0 && (
              <span style={{
                background: '#6366f1', color: 'white',
                borderRadius: '999px', fontSize: '0.75rem',
                fontWeight: '700', padding: '0.1rem 0.55rem',
              }}>
                {unreadCount}
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Ride updates and alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
              color: '#818cf8', borderRadius: '8px', padding: '0.5rem 0.9rem',
              fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['all', 'unread'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: filter === tab ? '#6366f1' : 'rgba(255,255,255,0.07)',
              color: filter === tab ? 'white' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {groupLabels.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, display: 'block' }} />
          <p style={{ margin: 0, fontWeight: '600' }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
            Ride updates will appear here in real time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {groupLabels.map(label => (
            <div key={label}>
              <div style={{
                fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--text-muted)',
                marginBottom: '0.5rem', paddingLeft: '0.25rem',
              }}>
                {label}
              </div>
              <div className="glass-card" style={{ padding: '0.25rem' }}>
                {grouped[label].map((notif, idx) => (
                  <React.Fragment key={notif.id}>
                    <NotifRow notif={notif} />
                    {idx < grouped[label].length - 1 && (
                      <div style={{ height: '1px', background: 'var(--border)', margin: '0 1.25rem' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
