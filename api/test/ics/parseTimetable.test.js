const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readIcsUpload, parseTimetable, ICS_LIMITS } = require('../../src/ics/parseTimetable');

const SAMPLE = path.join(__dirname, '../../prisma/fixtures/sample-timetable.ics');

function calendar(...events) {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flat(), 'END:VCALENDAR'].join('\r\n');
}

function vevent(lines) {
  return ['BEGIN:VEVENT', ...lines, 'END:VEVENT'];
}

function upload(text, originalname = 'timetable.ics') {
  const buffer = Buffer.from(text, 'utf8');
  return { originalname, size: buffer.length, buffer };
}

function assertInvalid(fn, messagePattern) {
  assert.throws(fn, (err) => {
    assert.equal(err.code, 'INVALID_ICS_FORMAT');
    assert.equal(err.status, 400);
    if (messagePattern) assert.match(err.message, messagePattern);
    return true;
  });
}

const ONE_EVENT = vevent([
  'UID:e1',
  'DTSTART;TZID=Asia/Ho_Chi_Minh:20260907T073000',
  'DTEND;TZID=Asia/Ho_Chi_Minh:20260907T093000',
  'SUMMARY:CS101 Intro',
]);

describe('readIcsUpload (file limits)', () => {
  test('accepts a valid .ics file and strips a UTF-8 BOM', () => {
    const text = readIcsUpload(upload('﻿' + calendar(ONE_EVENT)));
    assert.ok(text.startsWith('BEGIN:VCALENDAR'));
  });

  test('accepts the extension case-insensitively', () => {
    assert.doesNotThrow(() => readIcsUpload(upload(calendar(ONE_EVENT), 'HK1.ICS')));
  });

  test('rejects a missing file', () => {
    assertInvalid(() => readIcsUpload(undefined), /Missing/);
  });

  test('rejects a wrong extension', () => {
    assertInvalid(() => readIcsUpload(upload(calendar(ONE_EVENT), 'timetable.txt')), /\.ics/);
  });

  test('rejects files over 2 MB', () => {
    const file = upload(calendar(ONE_EVENT));
    file.size = ICS_LIMITS.maxBytes + 1;
    assertInvalid(() => readIcsUpload(file), /2 MB/);
  });

  test('rejects content without the BEGIN:VCALENDAR header', () => {
    assertInvalid(() => readIcsUpload(upload('hello world')), /BEGIN:VCALENDAR/);
    assertInvalid(() => readIcsUpload(upload(ONE_EVENT.join('\r\n'))), /BEGIN:VCALENDAR/);
  });

  test('rejects a calendar with no VEVENT', () => {
    assertInvalid(() => readIcsUpload(upload(calendar())), /no VEVENT/);
  });

  test('accepts 500 events and rejects 501', () => {
    const many = (n) => calendar(...Array.from({ length: n }, (_, i) => vevent([`UID:e${i}`, 'SUMMARY:X'])));
    assert.doesNotThrow(() => readIcsUpload(upload(many(500))));
    assertInvalid(() => readIcsUpload(upload(many(501))), /501 events/);
  });
});

describe('parseTimetable', () => {
  test('WEEKLY with UNTIL and BYDAY creates one slot per weekday', () => {
    const { courses } = parseTimetable(
      calendar(
        vevent([
          'UID:cs101',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260907T073000',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260907T093000',
          'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261220T165959Z',
          'SUMMARY:CS101 Introduction to Programming',
          'LOCATION:Room A101',
        ]),
      ),
    );

    assert.equal(courses.length, 1);
    const [mon, wed] = courses[0].schedules;
    assert.deepEqual(
      { day: mon.dayOfWeek, start: mon.startTime, end: mon.endTime, tz: mon.tz, until: mon.recurrenceUntil },
      { day: 1, start: '07:30:00', end: '09:30:00', tz: 'Asia/Ho_Chi_Minh', until: '2026-12-14' },
    );
    assert.equal(wed.dayOfWeek, 3);
    assert.equal(wed.recurrenceUntil, '2026-12-16');
    // Original timezone is kept, and the first occurrence is stored in UTC.
    assert.equal(mon.startsAtUtc.toISOString(), '2026-09-07T00:30:00.000Z');
    assert.equal(mon.endsAtUtc.toISOString(), '2026-09-07T02:30:00.000Z');
    assert.equal(mon.location, 'Room A101');
  });

  test('WEEKLY with COUNT computes the last occurrence date', () => {
    const { courses } = parseTimetable(
      calendar(
        vevent([
          'UID:math',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260908T094500',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260908T114500',
          'RRULE:FREQ=WEEKLY;COUNT=15',
          'SUMMARY:MATH 201 - Calculus II',
        ]),
      ),
    );
    const [slot] = courses[0].schedules;
    assert.equal(slot.dayOfWeek, 2);
    assert.equal(slot.recurrenceUntil, '2026-12-15'); // 8 Sep + 14 weeks
  });

  test('EXDATE removes occurrences, matched by local date', () => {
    const { courses } = parseTimetable(
      calendar(
        vevent([
          'UID:x',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260907T073000',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260907T093000',
          'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4',
          'EXDATE;TZID=Asia/Ho_Chi_Minh:20260914T073000',
          'EXDATE;VALUE=DATE:20260928',
          'SUMMARY:CS101 Intro',
        ]),
      ),
    );
    const [slot] = courses[0].schedules;
    assert.deepEqual(slot.exdates, ['2026-09-14T00:30:00.000Z', '2026-09-28T00:30:00.000Z']);
    // Last kept occurrence is 21 Sep (28 Sep is excluded).
    assert.equal(slot.recurrenceUntil, '2026-09-21');
  });

  test('converts TZID, UTC and Windows zone names', () => {
    const { courses } = parseTimetable(
      calendar(
        vevent([
          'UID:utc',
          'DTSTART:20260908T060000Z',
          'DTEND:20260908T083000Z',
          'SUMMARY:PHY110 Physics',
        ]),
        vevent([
          'UID:win',
          'DTSTART;TZID=SE Asia Standard Time:20260911T154500',
          'DTEND;TZID=SE Asia Standard Time:20260911T174500',
          'SUMMARY:ENG102 English',
        ]),
        vevent([
          'UID:ny',
          'DTSTART;TZID=America/New_York:20261102T090000',
          'DTEND;TZID=America/New_York:20261102T100000',
          'SUMMARY:HIS100 History',
        ]),
      ),
    );
    const byCode = Object.fromEntries(courses.map((c) => [c.code, c.schedules[0]]));

    assert.equal(byCode.PHY110.tz, 'Etc/UTC');
    assert.equal(byCode.PHY110.startTime, '06:00:00');

    assert.equal(byCode.ENG102.tz, 'Asia/Bangkok');
    assert.equal(byCode.ENG102.startsAtUtc.toISOString(), '2026-09-11T08:45:00.000Z');

    assert.equal(byCode.HIS100.tz, 'America/New_York');
    assert.equal(byCode.HIS100.startTime, '09:00:00');
    assert.equal(byCode.HIS100.startsAtUtc.toISOString(), '2026-11-02T14:00:00.000Z'); // EST, after DST ends
  });

  test('floating times use X-WR-TIMEZONE, else Asia/Ho_Chi_Minh', () => {
    const event = vevent(['UID:f', 'DTSTART:20260907T073000', 'DTEND:20260907T093000', 'SUMMARY:CS101 Intro']);

    const vn = parseTimetable(calendar(event)).courses[0].schedules[0];
    assert.equal(vn.tz, 'Asia/Ho_Chi_Minh');
    assert.equal(vn.startTime, '07:30:00');
    assert.equal(vn.startsAtUtc.toISOString(), '2026-09-07T00:30:00.000Z');

    const tokyo = parseTimetable(
      ['BEGIN:VCALENDAR', 'X-WR-TIMEZONE:Asia/Tokyo', ...event, 'END:VCALENDAR'].join('\r\n'),
    ).courses[0].schedules[0];
    assert.equal(tokyo.tz, 'Asia/Tokyo');
    assert.equal(tokyo.startsAtUtc.toISOString(), '2026-09-06T22:30:00.000Z');
  });

  test('keeps INTERVAL for every-other-week classes', () => {
    const { courses } = parseTimetable(
      calendar(
        vevent([
          'UID:bi',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260908T130000',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260908T150000',
          'RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3',
          'SUMMARY:PHY110 Lab',
        ]),
      ),
    );
    const [slot] = courses[0].schedules;
    assert.equal(slot.intervalWeeks, 2);
    assert.equal(slot.recurrenceUntil, '2026-10-06');
  });

  test('open-ended WEEKLY rules have no end date', () => {
    const { courses } = parseTimetable(
      calendar(
        vevent([
          'UID:open',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260907T073000',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260907T093000',
          'RRULE:FREQ=WEEKLY;BYDAY=MO,FR',
          'SUMMARY:CS101 Intro',
        ]),
      ),
    );
    assert.deepEqual(
      courses[0].schedules.map((s) => [s.dayOfWeek, s.recurrenceUntil]),
      [
        [1, null],
        [5, null],
      ],
    );
  });

  test('merges events with the same SUMMARY into one course', () => {
    const { courses } = parseTimetable(
      calendar(
        vevent([
          'UID:lec',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260907T073000',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260907T093000',
          'SUMMARY:CS101 Introduction to Programming',
        ]),
        vevent([
          'UID:lab',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260909T130000',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260909T150000',
          'SUMMARY:CS101 Introduction to Programming',
        ]),
      ),
    );
    assert.equal(courses.length, 1);
    assert.deepEqual(
      courses[0].schedules.map((s) => s.icsUid),
      ['lec', 'lab'],
    );
  });

  test('skips unsupported events with a reason instead of failing', () => {
    const { courses, skipped } = parseTimetable(
      calendar(
        ONE_EVENT,
        vevent(['UID:allday', 'DTSTART;VALUE=DATE:20261120', 'DTEND;VALUE=DATE:20261121', 'SUMMARY:Holiday']),
        vevent([
          'UID:daily',
          'DTSTART;TZID=Asia/Ho_Chi_Minh:20260910T080000',
          'DTEND;TZID=Asia/Ho_Chi_Minh:20260910T090000',
          'RRULE:FREQ=DAILY;COUNT=3',
          'SUMMARY:Daily standup',
        ]),
        vevent(['UID:nosummary', 'DTSTART:20260910T080000Z', 'DTEND:20260910T090000Z']),
      ),
    );
    assert.equal(courses.length, 1);
    assert.deepEqual(
      skipped.map((s) => s.uid),
      ['allday', 'daily', 'nosummary'],
    );
    assert.match(skipped[1].reason, /WEEKLY/);
  });

  test('parses the Google Calendar sample fixture', () => {
    const buffer = fs.readFileSync(SAMPLE);
    const { courses, skipped, eventCount } = parseTimetable(
      readIcsUpload({ originalname: 'sample-timetable.ics', size: buffer.length, buffer }),
    );
    assert.equal(eventCount, 6);
    assert.deepEqual(
      courses.map((c) => c.code),
      ['CS101', 'MATH201', 'PHY110', 'ENG102', null],
    );
    assert.equal(skipped.length, 1);
  });
});
