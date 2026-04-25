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
  // ── New types ──────────────────────────────────────────────
  NEW_RIDE:        'NEW_RIDE',        // instant — ride posted, sent to matching drivers
  RIDE_REMINDER:   'RIDE_REMINDER',   // scheduled — 5 min before departure
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

/**
 * Notify all available + matching drivers that a new ride has been posted.
 *
 * Strategy:
 *  1. Fetch all drivers whose vehicle_type matches the ride and who are 'available'.
 *  2. Insert one notification row per driver.
 *
 * @param {Object} params
 * @param {string} params.rideId
 * @param {string} params.pickup        - pickup location name
 * @param {string} params.destination   - destination name
 * @param {string} params.vehicleType   - 'cab' | 'autorickshaw'
 * @param {string} params.senderId      - the student who created the ride
 * @param {number} [params.price]       - total price
 * @param {string} [params.priorityType]
 */
export async function notifyNewRide({
  rideId,
  pickup,
  destination,
  vehicleType,
  senderId,
  price,
  priorityType = 'NORMAL',
}) {
  // Map frontend vehicle labels to DB values
  const dbVehicleType = vehicleType === 'Cab' || vehicleType === 'cab' ? 'cab' : 'autorickshaw'

  // Fetch matching available drivers
  const { data: drivers, error: driversError } = await supabase
    .from('drivers')
    .select('id')
    .eq('status', 'available')
    .eq('vehicle_type', dbVehicleType)

  if (driversError) {
    console.error('[notificationService] notifyNewRide — could not fetch drivers:', driversError.message)
    return
  }

  if (!drivers || drivers.length === 0) return

  const priorityEmoji = priorityType === 'EMERGENCY' ? '🚨' : priorityType === 'MEDICAL' ? '🏥' : priorityType === 'SENIOR' ? '👴' : '🚕'
  const priceText = price ? ` · ₹${price}` : ''
  const priorityText = priorityType !== 'NORMAL' ? ` [${priorityType}]` : ''

  const rows = drivers.map(d => ({
    user_id:   d.id,
    type:      NOTIF_TYPES.NEW_RIDE,
    title:     `${priorityEmoji} New Ride Request${priorityText}`,
    message:   `${pickup} → ${destination}${priceText}`,
    ride_id:   rideId,
    sender_id: senderId,
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) console.error('[notificationService] notifyNewRide insert error:', error.message)
}
