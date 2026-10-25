const { test } = require('node:test');
const assert = require('node:assert/strict');
const { expandSchedule } = require('../../src/ics/expandSchedule');
const { timeToDb, dateToDb } = require('../../src/ics/time');

function slot(overrides = {}) {
  return {
    id: 1,
    courseId: 1,
    course: { id: 1, code: 'CS101', name: 'Intro' },
    dayOfWeek: 1,
    startTime: timeToDb('07:30:00'),
    endTime: timeToDb('09:30:00'),
    location: 'A101',
    tz: 'Asia/Ho_Chi_Minh',
    recurrenceUntil: dateToDb('2026-12-14'),
    intervalWeeks: 1,
    startsAtUtc: new Date('2026-09-07T00:30:00Z'),
    endsAtUtc: new Date('2026-09-07T02:30:00Z'),
    exdates: [],
    ...overrides,
  };
}

const range = (from, to) => [new Date(from), new Date(to)];

test('expands one occurrence per week inside the range', () => {
  const events = expandSchedule(slot(), ...range('2026-10-25T17:00:00Z', '2026-11-08T17:00:00Z'), 'Asia/Ho_Chi_Minh');
  assert.deepEqual(
    events.map((e) => e.start),
    ['2026-10-26T07:30', '2026-11-02T07:30'],
  );
  assert.equal(events[0].startUtc, '2026-10-26T00:30:00.000Z');
  assert.equal(events[0].courseCode, 'CS101');
});

test('skips EXDATE occurrences', () => {
  const events = expandSchedule(
    slot({ exdates: ['2026-10-26T00:30:00.000Z'] }),
    ...range('2026-10-25T17:00:00Z', '2026-11-08T17:00:00Z'),
    'Asia/Ho_Chi_Minh',
  );
  assert.deepEqual(
    events.map((e) => e.start),
    ['2026-11-02T07:30'],
  );
});

test('respects the first occurrence and recurrence_until', () => {
  assert.equal(expandSchedule(slot(), ...range('2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z'), 'UTC').length, 0);
  assert.equal(expandSchedule(slot(), ...range('2026-12-15T00:00:00Z', '2027-01-15T00:00:00Z'), 'UTC').length, 0);
});

test('honours interval_weeks', () => {
  const events = expandSchedule(
    slot({ intervalWeeks: 2 }),
    ...range('2026-09-06T17:00:00Z', '2026-10-04T17:00:00Z'),
    'Asia/Ho_Chi_Minh',
  );
  assert.deepEqual(
    events.map((e) => e.start.slice(0, 10)),
    ['2026-09-07', '2026-09-21'],
  );
});

test('converts to the display timezone', () => {
  const ny = slot({
    tz: 'America/New_York',
    startTime: timeToDb('09:00:00'),
    endTime: timeToDb('10:00:00'),
    startsAtUtc: new Date('2026-10-26T13:00:00Z'),
    recurrenceUntil: null,
  });
  const events = expandSchedule(ny, ...range('2026-10-25T17:00:00Z', '2026-11-08T17:00:00Z'), 'Asia/Ho_Chi_Minh');
  // 09:00 New York is 20:00 Hanoi during EDT and 21:00 after DST ends on 1 Nov.
  assert.deepEqual(
    events.map((e) => e.start),
    ['2026-10-26T20:00', '2026-11-02T21:00'],
  );
});
