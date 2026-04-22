import { supabase } from '../supabaseClient'

// ─────────────────────────────────────────────────────────────
//  Notification type constants
// ─────────────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  JOIN_REQUEST:    'JOIN_REQUEST',
  JOIN_ACCEPTED:   'JOIN_ACCEPTED',
  JOIN_REJECTED:   'JOIN_REJECTED',
  JOIN_CONFIRMED:  'JOIN_CONFIRMED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
}

// ─────────────────────────────────────────────────────────────
//  createNotification — inserts one row into notifications
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {string}  params.user_id   - recipient user uuid (must exist in users table)
 * @param {string}  params.type      - one of NOTIF_TYPES
 * @param {string}  params.title
 * @param {string}  params.message
 * @param {string} [params.ride_id]
 * @param {string} [params.sender_id]
 */
export async function createNotification({ user_id, type, title, message, ride_id = null, sender_id = null }) {
  if (!user_id || !type || !title || !message) {
    console.warn('[notificationService] Missing required fields, skipping notification.')
    return
  }
  const { error } = await supabase.from('notifications').insert([{
    user_id,
    type,
    title,
    message,
    ride_id,
    sender_id,
  }])
  if (error) console.error('[notificationService] Failed to create notification:', error.message)
}

// ─────────────────────────────────────────────────────────────
//  Convenience wrappers for each event type
// ─────────────────────────────────────────────────────────────

/** Someone asked to join ride owner's ride */
export async function notifyJoinRequest({ ownerId, requesterName, rideId, senderId }) {
  return createNotification({
    user_id:   ownerId,
    type:      NOTIF_TYPES.JOIN_REQUEST,
    title:     'New Join Request',
    message:   `${requesterName} requested to join your ride`,
    ride_id:   rideId,
    sender_id: senderId,
  })
}

/** Owner accepted the passenger's request */
export async function notifyJoinAccepted({ passengerId, rideId, senderId }) {
  return createNotification({
    user_id:   passengerId,
    type:      NOTIF_TYPES.JOIN_ACCEPTED,
    title:     'Request Accepted! 🎉',
    message:   'Your request to join the ride was accepted',
    ride_id:   rideId,
    sender_id: senderId,
  })
}

/** Owner rejected the passenger's request */
export async function notifyJoinRejected({ passengerId, rideId, senderId }) {
  return createNotification({
    user_id:   passengerId,
    type:      NOTIF_TYPES.JOIN_REJECTED,
    title:     'Request Rejected',
    message:   'Your request to join the ride was not accepted',
    ride_id:   rideId,
    sender_id: senderId,
  })
}

/**
 * Notify a list of user IDs that a driver has been assigned to their ride.
 * Skips driver-type users (drivers use driver dashboard).
 *
 * @param {string[]} userIds    - list of student user IDs to notify
 * @param {string}   driverName
 * @param {string}   rideId
 */
export async function notifyDriverAssigned({ userIds, driverName, rideId }) {
  const rows = userIds.map(uid => ({
    user_id:  uid,
    type:     NOTIF_TYPES.DRIVER_ASSIGNED,
    title:    'Driver Assigned 🚗',
    message:  `${driverName} has been assigned to your ride`,
    ride_id:  rideId,
    sender_id: null,
  }))
  if (rows.length === 0) return
  const { error } = await supabase.from('notifications').insert(rows)
  if (error) console.error('[notificationService] notifyDriverAssigned error:', error.message)
}
