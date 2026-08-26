/**
 * "YYYY-MM-DD" in LOCAL time - NOT `date.toISOString().slice(0, 10)`, which
 * uses UTC. Schedule dates/hours are entered and compared as local
 * wall-clock values throughout this feature (matching the backend's
 * `combineDateAndHour` in ECW/src/momoHour/rewardEngine.js), so using the
 * UTC date here would misjudge "today" for up to an hour (or more,
 * depending on the browser's UTC offset) around local midnight.
 */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * MoMo Hour is Ghana-only, so every `campaign_date`/`start_hour`/`end_hour`
 * the backend stores and self-activates against is Ghana local time (GMT,
 * no DST) - NOT the admin's own browser timezone. `localDateString`/raw
 * `new Date()` above are fine when the admin happens to BE in Ghana, but
 * silently wrong otherwise (e.g. an admin in Nigeria, UTC+1, sees "today"/
 * "now" an hour ahead of Ghana's actual wall clock - enough to misjudge
 * whether a schedule has started, or land a new one on the wrong calendar
 * day near midnight). These two force the Africa/Accra timezone explicitly
 * regardless of where the browser itself is.
 */
export function ghanaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Accra',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function ghanaTimeString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

/** "Aug 5, 06:39–07:39" - a drop's window, in Ghana time, for dropdown/table
 * labels where a raw drop_id (an opaque UUID) means nothing to a human. */
export function formatGhanaWindow(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    month: 'short',
    day: 'numeric'
  }).format(start);
  return `${day}, ${ghanaTimeString(start)}–${ghanaTimeString(end)}`;
}
