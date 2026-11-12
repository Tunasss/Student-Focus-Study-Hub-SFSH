// WBS 3.4.1 — calendar-day helpers for analytics.
//
// A "day" is a local calendar date (YYYY-MM-DD) in the requested IANA timezone, so a
// session at 23:30 in Ho Chi Minh City counts for that evening, not for the next UTC day.

const { Temporal, toZoned, zonedToDate } = require('../ics/time');

// Date (UTC instant) -> 'YYYY-MM-DD' in tz.
function localDate(date, tz) {
  return toZoned(date, tz).toPlainDate().toString();
}

// 'YYYY-MM-DD' shifted by n days (n may be negative).
function addDays(isoDate, n) {
  return Temporal.PlainDate.from(isoDate).add({ days: n }).toString();
}

// The `count` consecutive local dates ending with (and including) `lastDate`, oldest first.
function lastNDays(lastDate, count) {
  return Array.from({ length: count }, (_, i) => addDays(lastDate, i - (count - 1)));
}

// UTC instant of local midnight at the start of isoDate in tz.
function startOfLocalDay(isoDate, tz) {
  return zonedToDate(isoDate, '00:00:00', tz);
}

module.exports = { localDate, addDays, lastNDays, startOfLocalDay };
