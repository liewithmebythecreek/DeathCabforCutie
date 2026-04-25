/**
 * dateUtils.js
 *
 * Shared date/time formatting utilities for ride cards and detail pages.
 */

/**
 * Formats a ride departure timestamp into a human-friendly string.
 *
 * Examples (IST):
 *   "Today • 5:30 PM"
 *   "Tomorrow • 9:00 AM"
 *   "26 Apr • 2:15 PM"
 *
 * @param {string|Date} dateInput - ISO string or Date object
 * @param {string} [locale='en-IN'] - BCP 47 locale tag
 * @returns {string}
 */
export function formatRideDateTime(dateInput, locale = 'en-IN') {
  const d = new Date(dateInput);
  if (isNaN(d)) return '—';

  const now = new Date();

  // Midnight boundaries in local time
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  const dayAfterStart = new Date(tomorrowStart);
  dayAfterStart.setDate(tomorrowStart.getDate() + 1);

  const timeStr = d.toLocaleString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (d >= todayStart && d < tomorrowStart) {
    return `Today • ${timeStr}`;
  }
  if (d >= tomorrowStart && d < dayAfterStart) {
    return `Tomorrow • ${timeStr}`;
  }

  const dateStr = d.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
  });
  return `${dateStr} • ${timeStr}`;
}

/**
 * Returns just the time portion, e.g. "5:30 PM".
 * Useful where space is tight (e.g. compact badges).
 *
 * @param {string|Date} dateInput
 * @param {string} [locale='en-IN']
 * @returns {string}
 */
export function formatRideTime(dateInput, locale = 'en-IN') {
  const d = new Date(dateInput);
  if (isNaN(d)) return '—';
  return d.toLocaleString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
}
