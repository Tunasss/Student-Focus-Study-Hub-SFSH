// WBS 3.4.3 — mandatory analytics cases (PRD): empty state, multi-course aggregation,
// streak continuity & reset, tenant isolation. Exercised end-to-end through the HTTP API.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./fixtures');

let ctx;
let alice;
let bob;

beforeEach(async () => {
  ctx = setup();
  alice = await ctx.signUp('alice@sfsh.dev');
  bob = await ctx.signUp('bob@sfsh.dev');
});

const overview = async (who, qs = '') => {
  const res = await who.get(`/api/analytics/overview${qs}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.success, true);
  return res.body.data;
};

describe('3.4.3 case 1: empty state user', () => {
  test('a new user gets zeros everywhere and an empty courseBreakdown (200, not 404)', async () => {
    for (const range of ['7d', '30d', 'all']) {
      const data = await overview(alice, `?range=${range}`);
      assert.equal(data.totalFocusMinutes, 0);
      assert.equal(data.completedTasksCount, 0);
      assert.equal(data.overdueTasksCount, 0);
      assert.equal(data.currentStreakDays, 0);
      assert.deepEqual(data.courseBreakdown, []);
    }
  });

  test('daily-activity is a zero-filled series, one row per day', async () => {
    for (const [range, days] of [['7d', 7], ['30d', 30]]) {
      const res = await alice.get(`/api/analytics/daily-activity?range=${range}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data.days.length, days);
      assert.ok(res.body.data.days.every((d) => d.focusMinutes === 0 && d.tasksCompleted === 0));
    }
  });
});

describe('3.4.3 case 2: multi-course aggregation', () => {
  test('focus minutes and progressPct are exact per course', async () => {
    const dsa = await alice.course('Data Structures & Algorithms', 'CS201');
    const db = await alice.course('Databases', 'CS202');
    const empty = await alice.course('Ethics', 'PHI101');

    // 57 of 100 items done: floor(57 / 100 * 100) is 56 in floating point; the API must say 57.
    await alice.topics(dsa, [...Array(50).fill('DONE'), ...Array(30).fill('TODO'), ...Array(10).fill('DOING')]);
    for (let i = 0; i < 7; i++) await alice.task(dsa, { status: 'DONE', completedAt: new Date() });
    for (let i = 0; i < 3; i++) await alice.task(dsa, { status: 'TODO' });
    // 1 of 3 = 33.33… -> 33 (floored, never rounded up).
    await alice.topics(db, ['DONE', 'TODO', 'DOING']);

    await alice.session({ course: dsa, minutes: 25 });
    await alice.session({ course: dsa, minutes: 50, daysAgo: 2 });
    await alice.session({ course: db, minutes: 30, daysAgo: 1 });
    await alice.session({ minutes: 15 }); // free focus: total only
    await alice.session({ course: db, minutes: 40, status: 'ABANDONED' }); // never counted
    await alice.session({ course: db, minutes: 60, daysAgo: 10 }); // outside 7d, inside 30d / all

    const week = await overview(alice);
    assert.equal(week.range, '7d');
    assert.equal(week.totalFocusMinutes, 25 + 50 + 30 + 15);
    assert.equal(week.completedTasksCount, 7);
    assert.deepEqual(
      week.courseBreakdown.map(({ courseId, focusMinutes, completedItems, totalItems, progressPct }) => ({
        courseId,
        focusMinutes,
        completedItems,
        totalItems,
        progressPct,
      })),
      [
        { courseId: dsa.id, focusMinutes: 75, completedItems: 57, totalItems: 100, progressPct: 57 },
        { courseId: db.id, focusMinutes: 30, completedItems: 1, totalItems: 3, progressPct: 33 },
        { courseId: empty.id, focusMinutes: 0, completedItems: 0, totalItems: 0, progressPct: 0 },
      ],
    );
    // WBS 4.1.1: task-only progress per course (7 of 10 tasks done in DSA; Databases and Ethics have no tasks).
    assert.deepEqual(
      week.courseBreakdown.map(({ courseId, completedTasks, totalTasks, taskProgressPct }) => ({
        courseId,
        completedTasks,
        totalTasks,
        taskProgressPct,
      })),
      [
        { courseId: dsa.id, completedTasks: 7, totalTasks: 10, taskProgressPct: 70 },
        { courseId: db.id, completedTasks: 0, totalTasks: 0, taskProgressPct: 0 },
        { courseId: empty.id, completedTasks: 0, totalTasks: 0, taskProgressPct: 0 },
      ],
    );
    assert.equal(week.courseBreakdown[0].courseName, 'Data Structures & Algorithms');
    assert.equal(week.courseBreakdown[0].courseCode, 'CS201');

    const all = await overview(alice, '?range=all');
    assert.equal(all.totalFocusMinutes, 25 + 50 + 30 + 15 + 60);
    assert.equal(all.courseBreakdown.find((c) => c.courseId === db.id).focusMinutes, 90);
    // Progress is all-time, whatever the range.
    assert.equal(all.courseBreakdown.find((c) => c.courseId === dsa.id).progressPct, 57);
  });
});

describe('3.4.3 case 3: streak continuity & reset', () => {
  const streak = async () => (await overview(alice)).currentStreakDays;

  test('consecutive days ending today increment the streak; extra sessions on a day count once', async () => {
    await alice.session({ daysAgo: 0 });
    await alice.session({ daysAgo: 0 });
    await alice.session({ daysAgo: 1 });
    await alice.session({ daysAgo: 2 });
    assert.equal(await streak(), 3);
  });

  test('a streak ending yesterday is still alive until the day is over', async () => {
    await alice.session({ daysAgo: 1 });
    await alice.session({ daysAgo: 2 });
    await alice.session({ daysAgo: 3 });
    assert.equal(await streak(), 3);
  });

  test('a missed day resets the streak to 0, or to 1 when the student studied today', async () => {
    await alice.session({ daysAgo: 2 });
    await alice.session({ daysAgo: 3 });
    assert.equal(await streak(), 0); // nothing yesterday or today

    await alice.session({ daysAgo: 0 });
    assert.equal(await streak(), 1); // today, then the gap yesterday
  });

  test('abandoned sessions do not keep a streak alive', async () => {
    await alice.session({ daysAgo: 0, status: 'ABANDONED' });
    await alice.session({ daysAgo: 1 });
    assert.equal(await streak(), 1);
  });

  test('the streak uses all history, not just the selected range', async () => {
    for (let d = 0; d < 12; d++) await alice.session({ daysAgo: d });
    assert.equal(await streak(), 12);
  });
});

describe('3.4.3 case 4: tenant isolation', () => {
  test("user A's metrics never include user B's courses, topics, tasks or sessions", async () => {
    const aliceCourse = await alice.course('Calculus');
    await alice.topics(aliceCourse, ['DONE', 'TODO']);
    await alice.session({ course: aliceCourse, minutes: 25 });

    const bobCourse = await bob.course('Bob only');
    await bob.topics(bobCourse, ['DONE', 'DONE', 'DONE']);
    await bob.task(bobCourse, { status: 'DONE', completedAt: new Date() });
    await bob.task(bobCourse, { status: 'OVERDUE', dueAt: new Date(Date.now() - 86400000) });
    for (let d = 0; d < 5; d++) await bob.session({ course: bobCourse, minutes: 100, daysAgo: d });

    const a = await overview(alice, '?range=all');
    assert.equal(a.totalFocusMinutes, 25);
    assert.equal(a.completedTasksCount, 0);
    assert.equal(a.overdueTasksCount, 0);
    assert.equal(a.currentStreakDays, 1);
    assert.deepEqual(a.courseBreakdown.map((c) => c.courseId), [aliceCourse.id]);
    assert.equal(a.courseBreakdown[0].progressPct, 50);
    assert.equal(a.courseBreakdown[0].totalTasks, 0);
    assert.equal(a.courseBreakdown[0].taskProgressPct, 0);

    const days = (await alice.get('/api/analytics/daily-activity')).body.data.days;
    assert.equal(days.reduce((s, d) => s + d.focusMinutes, 0), 25);
    assert.equal(days.reduce((s, d) => s + d.tasksCompleted, 0), 0);

    const b = await overview(bob, '?range=all');
    assert.equal(b.totalFocusMinutes, 500);
    assert.equal(b.currentStreakDays, 5);
    assert.deepEqual(b.courseBreakdown.map((c) => c.courseId), [bobCourse.id]);
    assert.equal(b.courseBreakdown[0].completedTasks, 1);
    assert.equal(b.courseBreakdown[0].totalTasks, 2);
    assert.equal(b.courseBreakdown[0].taskProgressPct, 50);
  });

  test('there is no way to ask for another user: user-ish query params are rejected or ignored', async () => {
    const bobCourse = await bob.course('Bob only');
    await bob.session({ course: bobCourse, minutes: 100 });
    const res = await alice.get(`/api/analytics/overview?userId=${bob.user.id}&user_id=${bob.user.id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.totalFocusMinutes, 0);
    assert.deepEqual(res.body.data.courseBreakdown, []);
  });

  test('analytics require a bearer token', async () => {
    const request = require('supertest');
    for (const path of ['/api/analytics/overview', '/api/analytics/daily-activity', '/api/analytics/chart-activity']) {
      const res = await request(ctx.app).get(path);
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'UNAUTHORIZED');
    }
  });
});
