// Expands stored weekly schedule slots into concrete class occurrences inside a
// time range, converted to the viewer's timezone (default Asia/Ho_Chi_Minh).

const { Temporal, timeFromDb, dateFromDb, toZoned, zonedToDate } = require('./time');

function weeksBetween(fromDate, toDate) {
  return Math.round(Temporal.PlainDate.from(fromDate).until(toDate, { largestUnit: 'day' }).days / 7);
}

function formatLocal(date, tz) {
  return toZoned(date, tz).toPlainDateTime().toString({ smallestUnit: 'minute' });
}

// schedule: Prisma Schedule row with `course` included. from/to: JS Dates.
function expandSchedule(schedule, from, to, displayTz) {
  const tz = schedule.tz;
  const startTime = timeFromDb(schedule.startTime);
  const endTime = timeFromDb(schedule.endTime);
  const until = dateFromDb(schedule.recurrenceUntil);
  const anchor = schedule.startsAtUtc ? toZoned(schedule.startsAtUtc, tz).toPlainDate() : null;
  const interval = schedule.intervalWeeks || 1;
  const exdates = new Set(Array.isArray(schedule.exdates) ? schedule.exdates : []);

  // Walk local days in the schedule's own zone, one day of padding each side.
  let day = toZoned(from, tz).toPlainDate().subtract({ days: 1 });
  const lastDay = toZoned(to, tz).toPlainDate().add({ days: 1 });
  const events = [];

  for (; Temporal.PlainDate.compare(day, lastDay) <= 0; day = day.add({ days: 1 })) {
    if (day.dayOfWeek !== schedule.dayOfWeek) continue;
    if (anchor && Temporal.PlainDate.compare(day, anchor) < 0) continue;
    if (until && Temporal.PlainDate.compare(day, until) > 0) break;
    if (anchor && weeksBetween(anchor, day) % interval !== 0) continue;

    const start = zonedToDate(day, startTime, tz);
    let end = zonedToDate(day, endTime, tz);
    if (end <= start) end = zonedToDate(day.add({ days: 1 }), endTime, tz); // crosses midnight

    if (end <= from || start >= to) continue;
    if (exdates.has(start.toISOString())) continue;

    events.push({
      scheduleId: schedule.id,
      courseId: schedule.courseId,
      courseCode: schedule.course?.code ?? null,
      courseName: schedule.course?.name ?? null,
      location: schedule.location,
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      start: formatLocal(start, displayTz),
      end: formatLocal(end, displayTz),
      dayOfWeek: toZoned(start, displayTz).dayOfWeek,
      sourceTz: tz,
    });
  }

  return events;
}

function expandSchedules(schedules, from, to, displayTz) {
  return schedules
    .flatMap((s) => expandSchedule(s, from, to, displayTz))
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

module.exports = { expandSchedule, expandSchedules };
