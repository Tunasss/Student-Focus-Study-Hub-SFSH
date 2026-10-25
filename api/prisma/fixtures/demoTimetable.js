// Builds the demo student's timetable as .ics text, with the semester placed
// around "now" so the seed always has classes this week. Exercises the same
// RRULE (UNTIL / COUNT), EXDATE and TZID handling as a real Google Calendar export.

const { Temporal } = require('temporal-polyfill');

const TZ = 'Asia/Ho_Chi_Minh';

function icsLocal(date, time) {
  return `${date.toString().replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
}

function buildDemoIcs(now = new Date()) {
  const today = Temporal.Instant.fromEpochMilliseconds(now.getTime()).toZonedDateTimeISO(TZ).toPlainDate();
  // Semester: started on the Monday 4 weeks ago, runs 15 weeks.
  const semesterStart = today.subtract({ days: today.dayOfWeek - 1, weeks: 4 });
  const semesterEnd = semesterStart.add({ weeks: 15 }).subtract({ days: 1 }); // last Sunday
  const untilUtc = `${semesterEnd.toString().replace(/-/g, '')}T165959Z`; // 23:59:59 local
  const on = (dayOfWeek) => semesterStart.add({ days: dayOfWeek - 1 });
  // A public holiday in week 7 cancels one Physics class.
  const holiday = on(2).add({ weeks: 6 });

  const events = [
    {
      uid: 'cs101-lecture',
      summary: 'CS101 Introduction to Programming',
      date: on(1), start: '07:30', end: '09:30', location: 'Room A101',
      rrule: `FREQ=WEEKLY;BYDAY=MO;UNTIL=${untilUtc}`,
    },
    {
      uid: 'cs101-lab',
      summary: 'CS101 Introduction to Programming', // same SUMMARY -> same course
      date: on(3), start: '07:30', end: '09:30', location: 'Lab B204',
      rrule: `FREQ=WEEKLY;BYDAY=WE;UNTIL=${untilUtc}`,
    },
    {
      uid: 'math201',
      summary: 'MATH 201 - Calculus II',
      date: on(2), start: '09:45', end: '11:45', location: 'Room C302',
      rrule: 'FREQ=WEEKLY;BYDAY=TU,TH;COUNT=30',
    },
    {
      uid: 'phy110',
      summary: 'PHY110 General Physics I',
      date: on(2), start: '13:00', end: '15:30', location: 'Room D105',
      rrule: `FREQ=WEEKLY;UNTIL=${untilUtc}`,
      exdate: icsLocal(holiday, '13:00'),
    },
    {
      uid: 'eng102',
      summary: 'ENG102: Academic English',
      date: on(5), start: '15:45', end: '17:45', location: 'Room E201',
      rrule: `FREQ=WEEKLY;UNTIL=${untilUtc}`,
    },
  ];

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SFSH//Demo Timetable//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${TZ}`,
  ];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@sfsh.dev`,
      `DTSTART;TZID=${TZ}:${icsLocal(e.date, e.start)}`,
      `DTEND;TZID=${TZ}:${icsLocal(e.date, e.end)}`,
      `RRULE:${e.rrule}`,
      ...(e.exdate ? [`EXDATE;TZID=${TZ}:${e.exdate}`] : []),
      `SUMMARY:${e.summary}`,
      `LOCATION:${e.location}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

module.exports = { buildDemoIcs };
