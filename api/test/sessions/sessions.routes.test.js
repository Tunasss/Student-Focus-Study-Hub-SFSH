// WBS 3.4 — focus session logging endpoints (Rule 02 envelope, Rule 06 scoping).
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');

const MINUTE = 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms).toISOString();

let prisma;
let app;
let alice;
let bob;

async function signUp(email) {
  const res = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
  const user = prisma.users.find((u) => u.email === email);
  const course = await prisma.course.create({ data: { userId: user.id, code: 'CS101', name: 'Programming' } });
  const other = await prisma.course.create({ data: { userId: user.id, code: 'MA101', name: 'Calculus' } });
  const topic = await prisma.topic.create({ data: { courseId: course.id, sortOrder: 1, title: 'Chapter 1' } });
  const task = await prisma.task.create({
    data: { userId: user.id, courseId: course.id, topicId: topic.id, title: 'Lab 1', dueAt: new Date(Date.now() + 86400000) },
  });
  const as = (req) => req.set('Authorization', `Bearer ${res.body.data.token}`);
  return { user, course, other, topic, task, as };
}

beforeEach(async () => {
  prisma = createFakePrisma();
  app = createApp({ prisma });
  alice = await signUp('alice@sfsh.dev');
  bob = await signUp('bob@sfsh.dev');
});

const post = (who, body) => who.as(request(app).post('/api/sessions')).send(body);
const log = (who, extra = {}) => post(who, { startedAt: ago(30 * MINUTE), minutes: 25, ...extra });

describe('POST /api/sessions', () => {
  test('logs a completed session for the JWT user (201, envelope, no owner column)', async () => {
    const startedAt = ago(30 * MINUTE);
    const res = await post(alice, { startedAt, minutes: 25, courseId: alice.course.id, topicId: alice.topic.id });

    assert.equal(res.status, 201);
    assert.deepEqual(Object.keys(res.body).sort(), ['data', 'error', 'success', 'timestamp']);
    assert.deepEqual(res.body.data.session, {
      id: res.body.data.session.id,
      startedAt,
      minutes: 25,
      status: 'COMPLETED',
      courseId: alice.course.id,
      topicId: alice.topic.id,
      taskId: null,
    });
    assert.equal(prisma.sessions[0].userId, alice.user.id);
  });

  test('free focus (no links) and ABANDONED sessions are accepted', async () => {
    const res = await log(alice, { status: 'ABANDONED', minutes: 7 });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.session.status, 'ABANDONED');
    assert.equal(res.body.data.session.courseId, null);
  });

  test('a task fills in its course and topic; a topic fills in its course', async () => {
    const fromTask = await log(alice, { taskId: alice.task.id });
    assert.equal(fromTask.body.data.session.courseId, alice.course.id);
    assert.equal(fromTask.body.data.session.topicId, alice.topic.id);

    const fromTopic = await log(alice, { topicId: alice.topic.id });
    assert.equal(fromTopic.body.data.session.courseId, alice.course.id);
  });

  test('rejects links that disagree with the course', async () => {
    const res = await log(alice, { courseId: alice.other.id, taskId: alice.task.id });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.match(res.body.error.message, /taskId/);

    const topic = await log(alice, { courseId: alice.other.id, topicId: alice.topic.id });
    assert.equal(topic.status, 400);
    assert.match(topic.body.error.message, /topicId/);
  });

  test("another user's course, topic or task is 404 NOT_FOUND and nothing is written", async () => {
    for (const body of [{ courseId: bob.course.id }, { topicId: bob.topic.id }, { taskId: bob.task.id }]) {
      const res = await log(alice, body);
      assert.equal(res.status, 404, JSON.stringify(body));
      assert.equal(res.body.error.code, 'NOT_FOUND');
    }
    assert.equal(prisma.sessions.length, 0);
  });

  test('validates the body', async () => {
    const cases = [
      [{}, /startedAt/],
      [{ startedAt: '2026-11-12 20:00', minutes: 25 }, /startedAt/],
      [{ startedAt: ago(MINUTE), minutes: 0 }, /minutes/],
      [{ startedAt: ago(MINUTE), minutes: 241 }, /minutes/],
      [{ startedAt: ago(MINUTE), minutes: 2.5 }, /minutes/],
      [{ startedAt: ago(MINUTE), minutes: 25, status: 'DONE' }, /status/],
      [{ startedAt: ago(MINUTE), minutes: 25, userId: bob.user.id }, /userId|Unrecognized/i],
      [{ startedAt: new Date(Date.now() + 60 * MINUTE).toISOString(), minutes: 25 }, /future/],
    ];
    for (const [body, field] of cases) {
      const res = await post(alice, body);
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      assert.match(res.body.error.message, field);
    }
  });

  test('requires a bearer token', async () => {
    const res = await request(app).post('/api/sessions').send({ startedAt: ago(MINUTE), minutes: 25 });
    assert.equal(res.status, 401);
  });
});

describe('GET /api/sessions', () => {
  const list = (who, qs = '') => who.as(request(app).get(`/api/sessions${qs}`));

  test("lists only the user's sessions, newest first", async () => {
    await log(alice, { startedAt: ago(90 * MINUTE) });
    await log(alice, { startedAt: ago(30 * MINUTE), courseId: alice.course.id });
    await log(bob, { startedAt: ago(10 * MINUTE) });

    const res = await list(alice);
    assert.equal(res.status, 200);
    const { sessions } = res.body.data;
    assert.equal(sessions.length, 2);
    assert.ok(new Date(sessions[0].startedAt) > new Date(sessions[1].startedAt));
    assert.equal(sessions[0].courseId, alice.course.id);
  });

  test('filters by from / to / course_id / status and honours limit', async () => {
    await log(alice, { startedAt: ago(5 * 60 * MINUTE), courseId: alice.course.id });
    await log(alice, { startedAt: ago(3 * 60 * MINUTE), courseId: alice.other.id, status: 'ABANDONED' });
    await log(alice, { startedAt: ago(60 * MINUTE), courseId: alice.course.id });

    const count = async (qs) => (await list(alice, qs)).body.data.sessions.length;
    assert.equal(await count(`?course_id=${alice.course.id}`), 2);
    assert.equal(await count('?status=ABANDONED'), 1);
    assert.equal(await count(`?from=${encodeURIComponent(ago(4 * 60 * MINUTE))}`), 2);
    assert.equal(await count(`?to=${encodeURIComponent(ago(4 * 60 * MINUTE))}`), 1);
    assert.equal(await count('?limit=1'), 1);
  });

  test('validates query params', async () => {
    for (const qs of ['?limit=0', '?limit=201', '?status=DONE', '?course_id=abc', '?from=yesterday']) {
      const res = await list(alice, qs);
      assert.equal(res.status, 400, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
    const backwards = await list(alice, `?from=${encodeURIComponent(ago(0))}&to=${encodeURIComponent(ago(60 * MINUTE))}`);
    assert.equal(backwards.status, 400);
    assert.match(backwards.body.error.message, /from/);
  });
});

describe('sessions feed the analytics', () => {
  test('a logged session shows up in the overview and today\'s daily activity', async () => {
    await log(alice, { startedAt: new Date().toISOString(), courseId: alice.course.id, minutes: 45 });
    const overview = await alice.as(request(app).get('/api/analytics/overview'));
    assert.equal(overview.body.data.totalFocusMinutes, 45);
    assert.equal(overview.body.data.currentStreakDays, 1);
    const daily = await alice.as(request(app).get('/api/analytics/daily-activity'));
    assert.equal(daily.body.data.days.at(-1).focusMinutes, 45);
  });
});
