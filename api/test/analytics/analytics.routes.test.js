// WBS 3.4.2 — analytics endpoints: validation, ranges, overdue count, daily series over HTTP.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setup, DAY } = require('./fixtures');
const { localDate } = require('../../src/analytics/dates');

let alice;

beforeEach(async () => {
  alice = await setup().signUp('alice@sfsh.dev');
});

function assertValidationError(res, field) {
  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(res.body).sort(), ['data', 'error', 'success', 'timestamp']);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.match(res.body.error.message, new RegExp(field));
}

describe('GET /api/analytics/overview', () => {
  test('defaults to range=7d and UTC days', async () => {
    const res = await alice.get('/api/analytics/overview');
    assert.equal(res.status, 200);
    const { range, tz, from, to } = res.body.data;
    assert.equal(range, '7d');
    assert.equal(tz, 'UTC');
    assert.equal(to, new Date().toISOString().slice(0, 10));
    assert.equal(from, new Date(Date.now() - 6 * DAY).toISOString().slice(0, 10));
  });

  test('tz moves the day boundaries to the client\'s local days', async () => {
    const res = await alice.get('/api/analytics/overview?tz=Asia/Ho_Chi_Minh');
    assert.equal(res.body.data.tz, 'Asia/Ho_Chi_Minh');
    assert.equal(res.body.data.to, localDate(new Date(), 'Asia/Ho_Chi_Minh'));
  });

  test('timestamps are stored in UTC whatever offset the client sends', async () => {
    const course = await alice.course('Physics');
    const res = await alice
      .as(require('supertest')(alice.app).post('/api/sessions'))
      .send({ startedAt: '2026-11-11T23:30:00+07:00', minutes: 25, courseId: course.id });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.session.startedAt, '2026-11-11T16:30:00.000Z');
  });

  test('range=all has no start date', async () => {
    const res = await alice.get('/api/analytics/overview?range=all&tz=UTC');
    assert.equal(res.body.data.from, null);
    assert.equal(res.body.data.tz, 'UTC');
  });

  test('rejects an unknown range or timezone with VALIDATION_ERROR', async () => {
    assertValidationError(await alice.get('/api/analytics/overview?range=90d'), 'range');
    assertValidationError(await alice.get('/api/analytics/overview?range='), 'range');
    assertValidationError(await alice.get('/api/analytics/overview?tz=Mars/Base'), 'tz');
  });

  test('completedTasksCount follows completedAt within the range; old DONE tasks only count in all', async () => {
    const course = await alice.course('Physics');
    await alice.task(course, { status: 'DONE', completedAt: new Date() });
    await alice.task(course, { status: 'DONE', completedAt: new Date(Date.now() - 20 * DAY) });
    await alice.task(course, { status: 'DONE', completedAt: null }); // finished before WBS 3.4
    await alice.task(course, { status: 'TODO' });

    const count = async (range) => (await alice.get(`/api/analytics/overview?range=${range}`)).body.data.completedTasksCount;
    assert.equal(await count('7d'), 1);
    assert.equal(await count('30d'), 2);
    assert.equal(await count('all'), 3);
  });

  test('overdueTasksCount = open tasks past due now (OVERDUE status or dueAt passed), any range', async () => {
    const course = await alice.course('Physics');
    await alice.task(course, { status: 'OVERDUE', dueAt: new Date(Date.now() - 40 * DAY) });
    await alice.task(course, { status: 'TODO', dueAt: new Date(Date.now() - DAY) });
    await alice.task(course, { status: 'DOING', dueAt: new Date(Date.now() - 60 * 1000) });
    await alice.task(course, { status: 'DONE', dueAt: new Date(Date.now() - DAY), completedAt: new Date() });
    await alice.task(course, { status: 'TODO', dueAt: new Date(Date.now() + DAY) });

    const res = await alice.get('/api/analytics/overview?range=7d');
    assert.equal(res.body.data.overdueTasksCount, 3);
  });
});

describe('GET /api/analytics/daily-activity', () => {
  test('returns one row per local day, oldest first, with today last', async () => {
    const course = await alice.course('Physics');
    await alice.session({ course, minutes: 25 });
    await alice.session({ course, minutes: 50, daysAgo: 2 });
    await alice.session({ course, minutes: 99, daysAgo: 8 }); // outside 7d
    await alice.session({ course, minutes: 10, status: 'ABANDONED' });
    await alice.task(course, { status: 'DONE', completedAt: new Date() });

    const res = await alice.get('/api/analytics/daily-activity?tz=UTC');
    assert.equal(res.status, 200);
    const { range, tz, days } = res.body.data;
    assert.equal(range, '7d');
    assert.equal(tz, 'UTC');
    assert.equal(days.length, 7);
    assert.equal(days.at(-1).date, localDate(new Date(), 'UTC'));
    assert.deepEqual(days.at(-1), { date: days.at(-1).date, focusMinutes: 25, tasksCompleted: 1 });
    assert.equal(days.at(-3).focusMinutes, 50);
    assert.equal(days.reduce((s, d) => s + d.focusMinutes, 0), 75);
    for (let i = 1; i < days.length; i++) assert.ok(days[i - 1].date < days[i].date);

    const month = await alice.get('/api/analytics/daily-activity?range=30d&tz=UTC');
    assert.equal(month.body.data.days.length, 30);
    assert.equal(month.body.data.days.reduce((s, d) => s + d.focusMinutes, 0), 75 + 99);
  });

  test('only 7d and 30d are valid ranges', async () => {
    assertValidationError(await alice.get('/api/analytics/daily-activity?range=all'), 'range');
    assertValidationError(await alice.get('/api/analytics/daily-activity?range=1y'), 'range');
    assertValidationError(await alice.get('/api/analytics/daily-activity?tz=Nowhere'), 'tz');
  });
});
