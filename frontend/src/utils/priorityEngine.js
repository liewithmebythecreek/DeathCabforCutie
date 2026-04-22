// ─────────────────────────────────────────────────────────────
//  priorityEngine.js — Ride Priority Scoring & Config
// ─────────────────────────────────────────────────────────────

export const PRIORITY_TYPES = ['NORMAL', 'SENIOR', 'MEDICAL', 'EMERGENCY']

export const PRIORITY_CONFIG = {
  NORMAL: {
    label:       'Normal',
    emoji:       '',
    baseScore:   0,
    color:       null,
    bg:          null,
    border:      null,
    description: 'Standard ride request',
    needsNotes:  false,
  },
  SENIOR: {
    label:       'Senior Citizen',
    emoji:       '👴',
    baseScore:   2,
    color:       '#38bdf8',
    bg:          'rgba(56,189,248,0.12)',
    border:      'rgba(56,189,248,0.4)',
    description: 'Elderly passenger — please be patient',
    needsNotes:  false,
  },
  MEDICAL: {
    label:       'Medical',
    emoji:       '🏥',
    baseScore:   4,
    color:       '#fb923c',
    bg:          'rgba(251,146,60,0.12)',
    border:      'rgba(251,146,60,0.4)',
    description: 'Medical appointment or health need',
    needsNotes:  true,
  },
  EMERGENCY: {
    label:       'Emergency',
    emoji:       '🚨',
    baseScore:   6,
    color:       '#ef4444',
    bg:          'rgba(239,68,68,0.12)',
    border:      'rgba(239,68,68,0.5)',
    description: 'Urgent — requires immediate pickup',
    needsNotes:  true,
  },
}

/**
 * Daily abuse limits — how many elevated rides a user can create per day.
 * NORMAL has no limit.
 */
export const DAILY_LIMITS = {
  SENIOR:    10,
  MEDICAL:   5,
  EMERGENCY: 2,
}

/**
 * Compute priority score client-side (mirrors the DB function).
 * @param {string} priorityType
 * @param {number} [distanceKm]
 * @param {number} [waitMins]   - minutes the ride has been waiting
 * @returns {number}
 */
export function calculatePriorityScore(priorityType, distanceKm = null, waitMins = 0) {
  const config = PRIORITY_CONFIG[priorityType] || PRIORITY_CONFIG.NORMAL
  let score = config.baseScore

  if (waitMins > 10) score += 1
  if (distanceKm !== null && distanceKm < 2) score += 1

  return score
}

/**
 * Returns minutes since the ride was created.
 */
export function minutesWaiting(createdAt) {
  return (Date.now() - new Date(createdAt).getTime()) / 60000
}

/**
 * Whether the priority is high enough to warrant a realtime alert on the driver side.
 */
export function isHighPriority(priorityType) {
  return ['MEDICAL', 'EMERGENCY'].includes(priorityType)
}
