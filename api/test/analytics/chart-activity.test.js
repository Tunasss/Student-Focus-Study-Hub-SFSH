// WBS 4.1.2 / 4.1.3 — GET /api/analytics/chart-activity?days=7|30: the zero-filled time series for the
// activity chart. Covers the zero-fill algorithm (with a fixed clock), validation, the empty state and
// tenant isolation.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setup, DAY } = require('./fixtures');
const { activitySeries } = require('../../src/analytics/analyticsRepo');

let ctx;
let alice;
let bob;

beforeEach(async () => {
  ctx = setup();
  alice = await ctx.signUp('alice@sfsh.dev');
  bob = await ctx.signUp('bob@sfsh.dev');
});

const chart = async (who, qs = '') => {
  const res = await who.get(`/api/analytics/chart-activity${qs}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.success, true);
  assert.equal(res.body.error, null);
  return res.body.data;
};

const utcDate = (msAgo = 0) => new Date(Date.now() - msAgo).toISOString().slice(0, 10);

describe('zero-fill algorithm (WBS 4.1.3 test 1)', () => {
  // Fixed clock: 2026-11-02 10:00 in Ho Chi Minh City (03:00 UTC), so the 7-day window crosses October 31.
  const now = new Date('2026-11-02T03:00:00Z');
  const series = (userId, opts) => activitySeries(ctx.prisma, userId, { now, tz: 'UTC', ...opts });
  const addSession = (userId, startedAt, minutes, status = 'COMPLETED') =>
    ctx.prisma.studySession.create({ data: { userId, startedAt: new Date(startedAt), minutes, status } });

  test('7 consecutive dates across a month boundary, quiet days filled with 0', async () => {
    await addSession(alice.user.id, '2026-10-28T08:00:00Z', 25);
    await addSession(alice.user.id, '2026-10-28T20:00:00Z', 50); // same day: summed
    await addSession(alice.user.id, '2026-11-02T01:00:00Z', 30); // today

    assert.deepEqual(await series(alice.user.id, { days: 7 }), [
      { date: '2026-10-27', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-10-28', focusMinutes: 75, tasksCompleted: 0 },
      { date: '2026-10-29', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-10-30', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-10-31', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-11-01', focusMinutes: 0, tasksCompleted: 0 },
      { date: '2026-11-02', focusMinutes: 30, tasksCompleted: 0 },
    ]);
  });

  test('30 days: no gaps, no duplicates, oldest first, today last', async () => {
    const days = await series(alice.user.id, { days: 30 });
    assert.equal(days.length, 30);
    assert.equal(days[0].date, '2026-10-04');
    assert.equal(days.at(-1).date, '2026-11-02');
    for (let i = 1; i < days.length; i++) {
      assert.equal(Date.parse(`${days[i].date}T00:00:00Z`) - Date.parse(`${days[i - 1].date}T00:00:00Z`), DAY);
    }
  });

  test('a session after local midnight counts for the local day, not the UTC day', async () => {
    // 2026-10-31 17:30 UTC = 2026-11-01 00:30 in Ho Chi Minh City (UTC+7).
    await addSession(alice.user.id, '2026-10-31T17:30:00Z', 40);
    const byDate = (rows) => Object.fromEntries(rows.map((r) => [r.date, r.focusMinutes]));

    const utc = byDate(await series(alice.user.id, { days: 7, tz: 'UTC' }));
    assert.equal(utc['2026-10-31'], 40);
    assert.equal(utc['2026-11-01'], 0);

    const hcm = byDate(await series(alice.user.id, { days: 7, tz: 'Asia/Ho_Chi_Minh' }));
    assert.equal(hcm['2026-10-31'], 0);
    assert.equal(hcm['2026-11-01'], 40);
  });

  test('only COMPLETED sessions inside the window; tasks counted on their completedAt day', async () => {
    await addSession(alice.user.id, '2026-11-01T09:00:00Z', 60, 'ABANDONED');
    await addSession(alice.user.id, '2026-10-26T23:59:59Z', 90); // the day before the window
    const course = await ctx.prisma.course.create({ data: { userId: alice.user.id, name: 'Physics' } });
    const task = (data) =>
      ctx.prisma.task.create({ data: { userId: alice.user.id, courseId: course.id, title: 'T', dueAt: now, ...data } });
    await task({ status: 'DONE', completedAt: new Date('2026-10-30T10:00:00Z') });
    await task({ status: 'DONE', completedAt: new Date('2026-10-30T22:00:00Z') });
    await task({ status: 'DONE', completedAt: null }); // finished before completed_at existed: no day
    await task({ status: 'TODO' });

    const days = await series(alice.user.id, { days: 7 });
    assert.equal(days.reduce((s, d) => s + d.focusMinutes, 0), 0);
    assert.deepEqual(
      days.filter((d) => d.tasksCompleted > 0),
      [{ date: '2026-10-30', focusMinutes: 0, tasksCompleted: 2 }],
    );
  });
});

describe('GET /api/analytics/chart-activity', () => {
  test('data is the bare series array; days defaults to 7', async () => {
    const data = await chart(alice);
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 7);
    assert.equal(data.at(-1).date, utcDate());
    assert.equal(data[0].date, utcDate(6 * DAY));
    for (const row of data) assert.deepEqual(Object.keys(row), ['date', 'focusMinutes', 'tasksCompleted']);
  });

  test('days=30 returns 30 rows', async () => {
    assert.equal((await chart(alice, '?days=30')).length, 30);
  });

  test('sums today\'s activity into the last row', async () => {
    const course = await alice.course('Physics');
    await alice.session({ course, minutes: 25 });
    await alice.session({ minutes: 15 });
    await alice.task(course, { status: 'DONE', completedAt: new Date() });
    const today = (await chart(alice, '?days=7&tz=UTC')).at(-1);
    assert.deepEqual(today, { date: utcDate(), focusMinutes: 40, tasksCompleted: 1 });
  });

  test('rejects anything but days=7 or 30, and bad timezones, with 400 VALIDATION_ERROR', async () => {
    for (const qs of ['?days=14', '?days=abc', '?days=-7', '?days=', '?days=7.5', '?days=7&days=30', '?tz=Mars/Base']) {
      const res = await alice.get(`/api/analytics/chart-activity${qs}`);
      assert.equal(res.status, 400, qs);
      assert.equal(res.body.success, false);
      assert.equal(res.body.data, null);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      assert.match(res.body.error.message, qs.includes('tz') ? /tz/ : /days/);
    }
  });

  test('empty state: a new account gets 200 and an all-zero series, never 404', async () => {
    for (const days of [7, 30]) {
      const data = await chart(alice, `?days=${days}`);
      assert.equal(data.length, days);
      assert.ok(data.every((d) => d.focusMinutes === 0 && d.tasksCompleted === 0));
    }
  });

  test('tenant isolation: another user\'s sessions and tasks never appear (WBS 4.1.3 test 3)', async () => {
    const bobCourse = await bob.course('Bob only');
    for (let d = 0; d < 7; d++) await bob.session({ course: bobCourse, minutes: 100, daysAgo: d });
    await bob.task(bobCourse, { status: 'DONE', completedAt: new Date() });

    const aliceCourse = await alice.course('Calculus');
    await alice.session({ course: aliceCourse, minutes: 25 });

    const a = await chart(alice, `?days=7&userId=${bob.user.id}&user_id=${bob.user.id}`);
    assert.equal(a.reduce((s, d) => s + d.focusMinutes, 0), 25);
    assert.equal(a.reduce((s, d) => s + d.tasksCompleted, 0), 0);

    const b = await chart(bob, '?days=7');
    assert.equal(b.reduce((s, d) => s + d.focusMinutes, 0), 700);
    assert.equal(b.reduce((s, d) => s + d.tasksCompleted, 0), 1);
  });

  test('requires a bearer token', async () => {
    const res = await request(ctx.app).get('/api/analytics/chart-activity');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});
