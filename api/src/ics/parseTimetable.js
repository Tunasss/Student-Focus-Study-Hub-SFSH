// Parses an .ics timetable (node-ical) into courses + weekly schedule slots.
//
// Supported: single events, RRULE FREQ=WEEKLY (UNTIL / COUNT / INTERVAL / BYDAY),
// EXDATE, TZID (incl. Windows zone names), UTC and floating times.
// Each (VEVENT, weekday) pair becomes one schedule slot.

const ical = require('node-ical');
const { ApiError } = require('../errors');
const { parseCourseSummary } = require('./courseName');
const { DEFAULT_TZ, isValidTimeZone, toZoned, zonedToDate } = require('./time');

const ICS_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  maxEvents: 500,
  extension: '.ics',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function invalidIcs(message) {
  return new ApiError(400, 'INVALID_ICS_FORMAT', message);
}

// Checks extension, size, VCALENDAR header and VEVENT count. Returns the text.
function readIcsUpload(file) {
  if (!file) {
    throw invalidIcs('Missing .ics file (multipart field "file")');
  }
  if (!String(file.originalname || '').toLowerCase().endsWith(ICS_LIMITS.extension)) {
    throw invalidIcs('File must have the .ics extension');
  }
  if (file.size > ICS_LIMITS.maxBytes) {
    throw invalidIcs('File is larger than 2 MB');
  }

  const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
  if (!/^\s*BEGIN:VCALENDAR\s*$/m.test(text.trimStart().split('\n', 1)[0])) {
    throw invalidIcs('File must start with BEGIN:VCALENDAR');
  }

  const eventCount = (text.match(/^BEGIN:VEVENT\r?$/gm) || []).length;
  if (eventCount === 0) {
    throw invalidIcs('Calendar contains no VEVENT');
  }
  if (eventCount > ICS_LIMITS.maxEvents) {
    throw invalidIcs(`Calendar has ${eventCount} events; the limit is ${ICS_LIMITS.maxEvents}`);
  }

  return text;
}

// node-ical reads floating times (no TZID, no Z) in the server's local zone.
// Re-read their wall clock in the calendar's zone instead.
function makeInstantResolver(floatingTz) {
  return function resolve(date, eventTz) {
    if (eventTz) return date;
    const pad = (n) => String(n).padStart(2, '0');
    const plainDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return zonedToDate(plainDate, time, floatingTz);
  };
}

// node-ical returns text properties as a string, or { val, params } when they carry parameters.
function textOf(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value.val === 'string') return value.val;
  return null;
}

function exdatesOf(event) {
  const seen = new Map();
  for (const value of Object.values(event.exdate || {})) {
    if (value instanceof Date) seen.set(value.getTime(), value);
  }
  return [...seen.values()];
}

// All occurrence starts of the event (before EXDATE filtering).
function occurrencesOf(event, interval) {
  if (!event.rrule) return [event.start];
  const { count, until } = event.rrule.options;
  if (count || until) return event.rrule.all();
  // Open-ended rule: one full cycle is enough to find every weekday slot.
  const cycleEnd = new Date(event.start.getTime() + interval * 7 * DAY_MS);
  return event.rrule.between(event.start, cycleEnd, true).filter((d) => d < cycleEnd);
}

function eventToSlots(event, { floatingTz }) {
  const rawTz = event.start.tz;
  const tz = rawTz && isValidTimeZone(rawTz) ? rawTz : floatingTz;
  const resolve = makeInstantResolver(floatingTz);

  let interval = 1;
  let openEnded = false;
  if (event.rrule) {
    const { freq, count, until } = event.rrule.options;
    if (String(freq).toUpperCase() !== 'WEEKLY' && freq !== 2) {
      return { skipped: `Unsupported RRULE frequency ${freq} (only WEEKLY)` };
    }
    interval = Math.max(1, Number(event.rrule.options.interval) || 1);
    openEnded = !count && !until;
  }

  const start = resolve(event.start, rawTz);
  const end = resolve(event.end || event.start, rawTz);
  const durationMs = end.getTime() - start.getTime();
  if (!(durationMs > 0)) {
    return { skipped: 'Event has no duration (DTEND must be after DTSTART)' };
  }

  // EXDATE is matched on the local date, so date-only EXDATEs and ones with a
  // slightly different time still cancel the class on that day.
  const localDate = (d) => toZoned(d, tz).toPlainDate().toString();
  const excluded = new Set(
    exdatesOf(event).map((d) => localDate(resolve(d, d.dateOnly ? undefined : d.tz || rawTz))),
  );
  const occurrences = occurrencesOf(event, interval).map((d) => resolve(d, rawTz));

  // Group by local weekday: first occurrence anchors the slot, last kept one ends it.
  const byWeekday = new Map();
  for (const occ of occurrences) {
    const local = toZoned(occ, tz);
    const group = byWeekday.get(local.dayOfWeek) || { first: occ, lastKept: null, exdates: [] };
    if (excluded.has(localDate(occ))) {
      group.exdates.push(occ);
    } else if (!group.lastKept || occ > group.lastKept) {
      group.lastKept = occ;
    }
    if (occ < group.first) group.first = occ;
    byWeekday.set(local.dayOfWeek, group);
  }

  const slots = [];
  for (const [dayOfWeek, group] of [...byWeekday.entries()].sort((a, b) => a[0] - b[0])) {
    if (!group.lastKept) continue; // every occurrence on this weekday was excluded
    const firstLocal = toZoned(group.first, tz);
    const endLocal = toZoned(new Date(group.first.getTime() + durationMs), tz);
    slots.push({
      icsUid: event.uid ? String(event.uid).slice(0, 255) : null,
      dayOfWeek,
      startTime: firstLocal.toPlainTime().toString({ smallestUnit: 'second' }),
      endTime: endLocal.toPlainTime().toString({ smallestUnit: 'second' }),
      location: textOf(event.location)?.trim().slice(0, 255) || null,
      tz,
      recurrenceUntil: openEnded ? null : toZoned(group.lastKept, tz).toPlainDate().toString(),
      intervalWeeks: interval,
      startsAtUtc: group.first,
      endsAtUtc: new Date(group.first.getTime() + durationMs),
      exdates: group.exdates.map((d) => d.toISOString()).sort(),
    });
  }

  if (slots.length === 0) {
    return { skipped: 'All occurrences are excluded by EXDATE' };
  }
  return { slots };
}

function parseTimetable(text, { defaultTz = DEFAULT_TZ } = {}) {
  let data;
  try {
    data = ical.sync.parseICS(text);
  } catch (err) {
    throw invalidIcs(`Could not parse calendar: ${err.message}`);
  }

  const calendarTz = data.vcalendar?.['WR-TIMEZONE'];
  const floatingTz = isValidTimeZone(calendarTz) ? calendarTz : defaultTz;

  const courses = new Map();
  const skipped = [];
  let eventCount = 0;

  for (const event of Object.values(data)) {
    if (!event || event.type !== 'VEVENT') continue;
    eventCount += 1;

    const summary = textOf(event.summary);
    const ref = { uid: event.uid ?? null, summary };

    if (!summary || !summary.trim()) {
      skipped.push({ ...ref, reason: 'Missing SUMMARY' });
      continue;
    }
    if (!(event.start instanceof Date) || Number.isNaN(event.start.getTime())) {
      skipped.push({ ...ref, reason: 'Missing or invalid DTSTART' });
      continue;
    }
    if (event.datetype === 'date' || event.start.dateOnly) {
      skipped.push({ ...ref, reason: 'All-day events are not class sessions' });
      continue;
    }

    const result = eventToSlots(event, { floatingTz });
    if (result.skipped) {
      skipped.push({ ...ref, reason: result.skipped });
      continue;
    }

    const parsed = parseCourseSummary(summary);
    const course = courses.get(parsed.key) || { ...parsed, schedules: [] };
    course.schedules.push(...result.slots);
    courses.set(parsed.key, course);
  }

  return { courses: [...courses.values()], skipped, eventCount };
}

module.exports = { ICS_LIMITS, readIcsUpload, parseTimetable };
