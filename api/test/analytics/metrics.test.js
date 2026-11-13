// WBS 3.4.1 / 4.1.3 — pure analytics math: progress formula (incl. large data), GROUP BY helpers, streaks,
// zero-filled series, local days.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  progressPct,
  totalMinutes,
  minutesByCourse,
  statusCountsByCourse,
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

// GROUP BY rows as Prisma returns them.
const focus = (courseId, minutes) => ({ courseId, _sum: { minutes } });
const counted = (courseId, status, n) => ({ courseId, status, _count: { _all: n } });

describe('GROUP BY helpers', () => {
  test('minutesByCourse skips free focus (courseId null); totalMinutes keeps it', () => {
    const groups = [focus(2, 50), focus(1, 10), focus(null, 99)];
    assert.deepEqual([...minutesByCourse(groups)], [[2, 50], [1, 10]]);
    assert.equal(totalMinutes(groups), 159);
  });

  test('a null SUM (no non-null values) counts as 0', () => {
    assert.equal(totalMinutes([focus(1, null)]), 0);
    assert.equal(minutesByCourse([focus(1, null)]).get(1), 0);
    assert.equal(totalMinutes([]), 0);
  });

  test('statusCountsByCourse: DONE is completed, every status is in the total', () => {
    const counts = statusCountsByCourse([
      counted(1, 'DONE', 3),
      counted(1, 'TODO', 2),
      counted(1, 'OVERDUE', 1),
      counted(2, 'DOING', 4),
    ]);
    assert.deepEqual(counts.get(1), { completed: 3, total: 6 });
    assert.deepEqual(counts.get(2), { completed: 0, total: 4 });
    assert.equal(counts.get(3), undefined);
  });
});

describe('courseBreakdown', () => {
  test('one row per course: topics + tasks progress, task-only progress, sorted by focus minutes', () => {
    const rows = courseBreakdown(
      [
        { id: 1, code: 'A', name: 'Algebra' },
        { id: 2, code: null, name: 'Biology' },
        { id: 3, code: null, name: 'Art' },
      ],
      {
        minutes: minutesByCourse([focus(2, 50), focus(1, 10), focus(null, 99)]),
        topicCounts: statusCountsByCourse([counted(1, 'DONE', 1), counted(1, 'DOING', 1), counted(2, 'TODO', 1)]),
        taskCounts: statusCountsByCourse([counted(1, 'DONE', 1), counted(1, 'OVERDUE', 1), counted(2, 'DONE', 1)]),
      },
    );
    const base = { completedTasks: 0, totalTasks: 0, taskProgressPct: 0 };
    assert.deepEqual(rows, [
      { courseId: 2, courseCode: null, courseName: 'Biology', focusMinutes: 50, completedItems: 1, totalItems: 2, progressPct: 50, ...base, completedTasks: 1, totalTasks: 1, taskProgressPct: 100 },
      { courseId: 1, courseCode: 'A', courseName: 'Algebra', focusMinutes: 10, completedItems: 2, totalItems: 4, progressPct: 50, ...base, completedTasks: 1, totalTasks: 2, taskProgressPct: 50 },
      { courseId: 3, courseCode: null, courseName: 'Art', focusMinutes: 0, completedItems: 0, totalItems: 0, progressPct: 0, ...base },
    ]);
  });

  test('no courses -> empty array; no groups -> zeros', () => {
    assert.deepEqual(courseBreakdown([], { minutes: minutesByCourse([focus(null, 5)]) }), []);
    const [row] = courseBreakdown([{ id: 7, code: null, name: 'New' }]);
    assert.equal(row.focusMinutes, 0);
    assert.equal(row.progressPct, 0);
    assert.equal(row.taskProgressPct, 0);
  });
});

// WBS 4.1.3 test 2: progress maths on a large data set.
describe('progress with large data (WBS 4.1.3)', () => {
  // Deterministic pseudo-random generator so the data set is the same on every run.
  function lcg(seed) {
    let x = seed;
    return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  }

  test('taskProgressPct and progressPct are exact for 10,000 tasks and 5,000 topics over 40 courses', () => {
    const rand = lcg(42);
    const COURSES = 40;
    const courses = Array.from({ length: COURSES }, (_, i) => ({ id: i + 1, code: `C${i + 1}`, name: `Course ${String(i + 1).padStart(2, '0')}` }));
    const statuses = ['TODO', 'DOING', 'DONE', 'OVERDUE'];
    // Course 40 has no tasks at all; course 39 has only DONE tasks.
    const tasks = Array.from({ length: 10000 }, () => {
      const courseId = 1 + Math.floor(rand() * (COURSES - 1));
      return { courseId, status: courseId === 39 ? 'DONE' : statuses[Math.floor(rand() * 4)] };
    });
    const topics = Array.from({ length: 5000 }, () => ({
      courseId: 1 + Math.floor(rand() * COURSES),
      status: statuses[Math.floor(rand() * 3)],
    }));

    // What GROUP BY course_id, status returns.
    const group = (rows) => {
      const m = new Map();
      for (const r of rows) {
        const k = `${r.courseId}|${r.status}`;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m].map(([k, n]) => counted(Number(k.split('|')[0]), k.split('|')[1], n));
    };
    const rows = courseBreakdown(courses, {
      topicCounts: statusCountsByCourse(group(topics)),
      taskCounts: statusCountsByCourse(group(tasks)),
    });

    assert.equal(rows.length, COURSES);
    for (const row of rows) {
      const myTasks = tasks.filter((t) => t.courseId === row.courseId);
      const myTopics = topics.filter((t) => t.courseId === row.courseId);
      const doneTasks = myTasks.filter((t) => t.status === 'DONE').length;
      const doneItems = doneTasks + myTopics.filter((t) => t.status === 'DONE').length;

      assert.equal(row.totalTasks, myTasks.length);
      assert.equal(row.completedTasks, doneTasks);
      assert.equal(row.totalItems, myTasks.length + myTopics.length);
      assert.equal(row.completedItems, doneItems);
      // Reference: integer floor without floating point.
      const ref = (done, total) => (total === 0 ? 0 : (done * 100 - ((done * 100) % total)) / total);
      assert.equal(row.taskProgressPct, ref(doneTasks, myTasks.length), `course ${row.courseId}`);
      assert.equal(row.progressPct, ref(doneItems, myTasks.length + myTopics.length), `course ${row.courseId}`);
      assert.ok(Number.isInteger(row.taskProgressPct) && row.taskProgressPct >= 0 && row.taskProgressPct <= 100);
    }
    assert.equal(rows.reduce((s, r) => s + r.totalTasks, 0), 10000);
    assert.equal(rows.find((r) => r.courseId === 40).taskProgressPct, 0); // no tasks: 0, not NaN
    assert.equal(rows.find((r) => r.courseId === 39).taskProgressPct, 100);
  });

  test('never reaches 100 until every task is done, even with huge counts', () => {
    assert.equal(progressPct(999999, 1000000), 99);
    assert.equal(progressPct(1000000, 1000000), 100);
    assert.equal(progressPct(1, 1000000), 0);
    assert.equal(progressPct(570000, 1000000), 57);
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
