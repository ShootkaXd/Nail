// The salon operates on Russian local time. Wall-clock times/dates entered
// by admins/masters ("09:00", "2026-07-01") mean that time in this
// timezone, not the server process's timezone (which is UTC in Docker by
// default). Russia has used a single permanent offset (no DST) since 2014,
// so a fixed offset is safe and avoids depending on the container having
// IANA tzdata installed / TZ env configured correctly.
const SALON_UTC_OFFSET_HOURS = 3 // Europe/Moscow (MSK, UTC+3, no DST)

// Builds the UTC instant corresponding to a given wall-clock date/time in
// the salon's local timezone — independent of the server's own TZ setting.
export function salonLocalToUtc(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  return new Date(Date.UTC(year, month - 1, day, hours - SALON_UTC_OFFSET_HOURS, minutes, seconds, ms))
}

// Parses a "YYYY-MM-DD" (optionally with a trailing time, which is ignored)
// date-only string as local midnight in the salon's timezone.
export function parseSalonDateStart(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number)
  return salonLocalToUtc(year, month, day, 0, 0, 0, 0)
}

// Same, but the last instant of that local calendar day (23:59:59.999).
export function parseSalonDateEnd(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(salonLocalToUtc(year, month, day + 1, 0, 0, 0, 0).getTime() - 1)
}
