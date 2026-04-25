import React, { useEffect, useRef } from 'react'
import { X, Bell, CheckCircle, XCircle, Car, Clock, AlertTriangle } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { NOTIF_TYPES } from '../utils/notificationService'
import { useNavigate } from 'react-router-dom'

const TYPE_META = {
  [NOTIF_TYPES.JOIN_REQUEST]:    { icon: Bell,          color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  [NOTIF_TYPES.JOIN_ACCEPTED]:   { icon: CheckCircle,   color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  [NOTIF_TYPES.JOIN_REJECTED]:   { icon: XCircle,       color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  [NOTIF_TYPES.JOIN_CONFIRMED]:  { icon: CheckCircle,   color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  [NOTIF_TYPES.DRIVER_ASSIGNED]: { icon: Car,           color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  [NOTIF_TYPES.NEW_RIDE]:        { icon: Car,           color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  [NOTIF_TYPES.RIDE_REMINDER]:   { icon: Clock,         color: '#f97316', bg: 'rgba(249,115,22,0.2)',  urgent: true },
}

function ToastItem({ toast }) {
  const { dismissToast } = useNotifications()
  const navigate = useNavigate()
  const meta = TYPE_META[toast.type] || { icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' }
  const Icon = meta.icon
  const progressRef = useRef(null)
  const duration = toast.type === NOTIF_TYPES.RIDE_REMINDER ? 8 : 5

  // Animate shrink bar
  useEffect(() => {
    if (!progressRef.current) return
    progressRef.current.style.transition = `width ${duration}s linear`
    progressRef.current.style.width = '0%'
  }, [])

  return (
    <div
      onClick={() => {
        if (toast.ride_id) navigate(`/ride/${toast.ride_id}`)
        dismissToast(toast.id)
      }}
      style={{
        background: meta.urgent ? 'rgba(30,15,5,0.97)' : 'var(--bg-card)',
        border: `1px solid ${meta.color}40`,
        borderLeft: `4px solid ${meta.color}`,
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        cursor: toast.ride_id ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        boxShadow: meta.urgent
          ? `0 8px 40px ${meta.color}40, 0 2px 8px rgba(0,0,0,0.6)`
          : '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '360px',
        animation: 'toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Urgent pulse ring */}
      {meta.urgent && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          border: `1.5px solid ${meta.color}`,
          animation: 'toast-pulse 1.5s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: meta.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: meta.urgent ? `0 0 12px ${meta.color}60` : undefined,
      }}>
        <Icon size={18} color={meta.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: meta.urgent ? meta.color : 'var(--text)', marginBottom: '0.2rem' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '0.8rem', color: meta.urgent ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', lineHeight: 1.4 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismissToast(toast.id) }}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.06)' }}>
        <div
          ref={progressRef}
          style={{ height: '100%', width: '100%', background: meta.color, borderRadius: '0 0 12px 12px' }}
        />
      </div>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useNotifications()

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toast-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 0.1; transform: scale(1.01); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: 'flex-end',
      }}>
        {toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
      </div>
    </>
  )
}
