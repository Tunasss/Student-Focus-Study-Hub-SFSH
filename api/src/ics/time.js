const { Temporal } = require('temporal-polyfill');

const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    Temporal.Now.instant().toZonedDateTimeISO(tz);
    return true;
  } catch {
    return false;
  }
}

function toZoned(date, tz) {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(tz);
}

// Wall clock (PlainDate + 'HH:mm:ss') in tz -> JS Date (UTC instant).
function zonedToDate(plainDate, time, tz) {
  const zdt = Temporal.PlainDate.from(plainDate).toZonedDateTime({
    timeZone: tz,
    plainTime: Temporal.PlainTime.from(time),
  });
  return new Date(zdt.epochMilliseconds);
}

// Prisma maps MySQL TIME to a Date on 1970-01-01 UTC and DATE to midnight UTC.
function timeToDb(hhmmss) {
  return new Date(`1970-01-01T${hhmmss}Z`);
}

function timeFromDb(date) {
  return date.toISOString().slice(11, 19);
}

function dateToDb(yyyyMmDd) {
  return new Date(`${yyyyMmDd}T00:00:00Z`);
}

function dateFromDb(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

module.exports = {
  Temporal,
  DEFAULT_TZ,
  isValidTimeZone,
  toZoned,
  zonedToDate,
  timeToDb,
  timeFromDb,
  dateToDb,
  dateFromDb,
};
