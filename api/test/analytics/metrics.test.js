// WBS 3.4.1 — pure analytics math: progress formula, streaks, zero-filled series, local days.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  progressPct,
  courseBreakdown,
  currentStreak,
  studyDatesOf,
  dailySeries,
} = require('../../src/analytics/metrics');
const { localDate, lastNDays, startOfLocalDay } = require('../../src/analytics/dates');
const { rangeStart } = require('../../src/analytics/analyticsRepo');

describe('progressPct', () => {
  test('floors completed / total * 100', () => {
    assert.equal(progressPct(1, 3), 33);
    assert.equal(progressPct(2, 3), 66); // floored, not rounded to 67
    assert.equal(progressPct(3, 3), 100);
    assert.equal(progressPct(0, 5), 0);
  });

  test('has no floating-point artefacts', () => {
    // 57 / 100 * 100 === 56.99999999999999 and 29 / 100 * 100 === 28.999999999999996 in IEEE 754.
    assert.equal(progressPct(57, 100), 57);
    assert.equal(progressPct(29, 100), 29);
    for (let total = 1; total <= 200; total++) {
      for (let done = 0; done <= total; done++) {
        const pct = progressPct(done, total);
        assert.ok(pct * total <= done * 100 && (pct + 1) * total > done * 100, `${done}/${total} -> ${pct}`);
      }
    }
  });

  test('is 0 when there is nothing to complete (no division by zero)', () => {
    assert.equal(progressPct(0, 0), 0);
    assert.equal(progressPct(3, 0), 0);
  });
});

describe('courseBreakdown', () => {
  test('one row per course, DONE topics + tasks over all topics + tasks, sorted by focus minutes', () => {
    const rows = courseBreakdown(
      [
        { id: 1, code: 'A', name: 'Algebra' },
        { id: 2, code: null, name: 'Biology' },
        { id: 3, code: null, name: 'Art' },
      ],
      {
        sessions: [
          { courseId: 2, minutes: 25 },
          { courseId: 2, minutes: 25 },
          { courseId: 1, minutes: 10 },
          { courseId: null, minutes: 99 },
        ],
        topics: [
          { courseId: 1, status: 'DONE' },
          { courseId: 1, status: 'DOING' },
          { courseId: 2, status: 'TODO' },
        ],
        tasks: [
          { courseId: 1, status: 'DONE' },
          { courseId: 1, status: 'OVERDUE' },
          { courseId: 2, status: 'DONE' },
        ],
      },
    );
    assert.deepEqual(rows, [
      { courseId: 2, courseCode: null, courseName: 'Biology', focusMinutes: 50, completedItems: 1, totalItems: 2, progressPct: 50 },
      { courseId: 1, courseCode: 'A', courseName: 'Algebra', focusMinutes: 10, completedItems: 2, totalItems: 4, progressPct: 50 },
      { courseId: 3, courseCode: null, courseName: 'Art', focusMinutes: 0, completedItems: 0, totalItems: 0, progressPct: 0 },
    ]);
  });

  test('no courses -> empty array', () => {
    assert.deepEqual(courseBreakdown([], { sessions: [{ courseId: null, minutes: 5 }], topics: [], tasks: [] }), []);
  });
});

describe('currentStreak', () => {
  const today = '2026-11-12';

  test('counts consecutive days back from today', () => {
    assert.equal(currentStreak(['2026-11-12', '2026-11-11', '2026-11-10'], today), 3);
  });

  test('stays alive when the last study day is yesterday', () => {
    assert.equal(currentStreak(['2026-11-11', '2026-11-10'], today), 2);
  });

  test('a gap ends the streak', () => {
    assert.equal(currentStreak(['2026-11-12', '2026-11-10', '2026-11-09'], today), 1);
    assert.equal(currentStreak(['2026-11-10', '2026-11-09'], today), 0);
    assert.equal(currentStreak([], today), 0);
  });

  test('crosses month and year boundaries', () => {
    assert.equal(currentStreak(['2027-01-01', '2026-12-31', '2026-12-30'], '2027-01-01'), 3);
    assert.equal(currentStreak(['2028-03-01', '2028-02-29', '2028-02-28'], '2028-03-01'), 3); // leap year
  });

  test('ignores future dates', () => {
    assert.equal(currentStreak(['2026-11-13', '2026-11-12'], today), 1);
  });
});

describe('local days (timezone)', () => {
  test('a session late in the evening counts for that local day, not the next UTC day', () => {
    const lateEvening = new Date('2026-11-11T16:30:00Z'); // 23:30 in Ho Chi Minh City
    assert.equal(localDate(lateEvening, 'Asia/Ho_Chi_Minh'), '2026-11-11');
    assert.equal(localDate(new Date('2026-11-11T17:30:00Z'), 'Asia/Ho_Chi_Minh'), '2026-11-12');
    assert.equal(localDate(new Date('2026-11-11T17:30:00Z'), 'UTC'), '2026-11-11');
  });

  test('study days follow the requested timezone', () => {
    const sessions = [{ startedAt: new Date('2026-11-11T17:30:00Z') }, { startedAt: new Date('2026-11-10T17:30:00Z') }];
    assert.equal(currentStreak(studyDatesOf(sessions, 'Asia/Ho_Chi_Minh'), '2026-11-12'), 2);
    assert.equal(currentStreak(studyDatesOf(sessions, 'UTC'), '2026-11-12'), 2); // 11th and 10th, alive via yesterday
    assert.equal(currentStreak(studyDatesOf(sessions, 'UTC'), '2026-11-13'), 0);
  });

  test('rangeStart is local midnight of the first day of the range', () => {
    assert.equal(rangeStart('7d', '2026-11-12', 'Asia/Ho_Chi_Minh').toISOString(), '2026-11-05T17:00:00.000Z');
    assert.equal(rangeStart('30d', '2026-11-12', 'UTC').toISOString(), '2026-10-14T00:00:00.000Z');
    assert.equal(rangeStart('all', '2026-11-12', 'UTC'), null);
    assert.equal(startOfLocalDay('2026-11-12', 'UTC').toISOString(), '2026-11-12T00:00:00.000Z');
  });

  test('lastNDays lists N dates ending today, oldest first', () => {
    assert.deepEqual(lastNDays('2026-03-02', 3), ['2026-02-28', '2026-03-01', '2026-03-02']);
  });
});

describe('dailySeries', () => {
  test('zero-fills days without activity and sums minutes / completed tasks per local day', () => {
    const series = dailySeries({
      today: '2026-11-12',
      days: 7,
      tz: 'Asia/Ho_Chi_Minh',
      sessions: [
        { startedAt: new Date('2026-11-12T01:00:00Z'), minutes: 25 },
        { startedAt: new Date('2026-11-12T02:00:00Z'), minutes: 50 },
        { startedAt: new Date('2026-11-09T16:59:00Z'), minutes: 15 }, // 23:59 local on the 9th
        { startedAt: new Date('2026-11-01T00:00:00Z'), minutes: 99 }, // before the window
      ],
      completedTasks: [
        { completedAt: new Date('2026-11-12T03:00:00Z') },
        { completedAt: new Date('2026-11-06T10:00:00Z') },
        { completedAt: null },
      ],
    });
    assert.deepEqual(series, [
      { date: '2026-11-06', focusMinutes: 0, tasksCompleted: 1 },
      { date: '2026-11-07', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-11-08', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-11-09', focusMinutes: 15, tasksCompleted: 0 },
      { date: '2026-11-10', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-11-11', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-11-12', focusMinutes: 75, tasksCompleted: 1 },
    ]);
  });

  test('30-day series has 30 consecutive dates', () => {
    const series = dailySeries({ today: '2026-11-12', days: 30, tz: 'UTC', sessions: [], completedTasks: [] });
    assert.equal(series.length, 30);
    assert.equal(series[0].date, '2026-10-14');
    assert.equal(series.at(-1).date, '2026-11-12');
  });
});
