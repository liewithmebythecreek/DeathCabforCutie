import React, { useEffect, useRef } from 'react'
import { X, Bell, CheckCircle, XCircle, Car } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { NOTIF_TYPES } from '../utils/notificationService'
import { useNavigate } from 'react-router-dom'

const TYPE_META = {
  [NOTIF_TYPES.JOIN_REQUEST]:    { icon: Bell,        color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  [NOTIF_TYPES.JOIN_ACCEPTED]:   { icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  [NOTIF_TYPES.JOIN_REJECTED]:   { icon: XCircle,     color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  [NOTIF_TYPES.JOIN_CONFIRMED]:  { icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  [NOTIF_TYPES.DRIVER_ASSIGNED]: { icon: Car,         color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
}

function ToastItem({ toast }) {
  const { dismissToast } = useNotifications()
  const navigate = useNavigate()
  const meta = TYPE_META[toast.type] || TYPE_META[NOTIF_TYPES.JOIN_REQUEST]
  const Icon = meta.icon
  const progressRef = useRef(null)

  // Animate shrink bar over 5 s
  useEffect(() => {
    if (!progressRef.current) return
    progressRef.current.style.transition = 'width 5s linear'
    progressRef.current.style.width = '0%'
  }, [])

  return (
    <div
      onClick={() => {
        if (toast.ride_id) navigate(`/ride/${toast.ride_id}`)
        dismissToast(toast.id)
      }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${meta.color}40`,
        borderLeft: `4px solid ${meta.color}`,
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        cursor: toast.ride_id ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        position: 'relative',
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '360px',
        animation: 'toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: meta.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={meta.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
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
