// WBS 2.4a.2 — Tasks CRUD endpoints (Rule 02 envelope, Rule 06 scoping).
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');

const DAY = 24 * 60 * 60 * 1000;
const inDays = (n) => new Date(Date.now() + n * DAY).toISOString();

let prisma;
let app;
let alice;
let bob;

async function signUp(email) {
  const res = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
  const user = prisma.users.find((u) => u.email === email);
  const course = await prisma.course.create({ data: { userId: user.id, code: 'CS101', name: 'Programming' } });
  const topic = await prisma.topic.create({ data: { courseId: course.id, sortOrder: 1, title: 'Chapter 1' } });
  const as = (req) => req.set('Authorization', `Bearer ${res.body.data.token}`);
  return { user, course, topic, as };
}

beforeEach(async () => {
  prisma = createFakePrisma();
  app = createApp({ prisma });
  alice = await signUp('alice@sfsh.dev');
  bob = await signUp('bob@sfsh.dev');
});

const createFor = (who, body = {}) =>
  who.as(request(app).post('/api/tasks')).send({ title: 'Lab 1', dueAt: inDays(2), courseId: who.course.id, ...body });

function assertEnvelope(res) {
  assert.deepEqual(Object.keys(res.body).sort(), ['data', 'error', 'success', 'timestamp']);
}

describe('POST /api/tasks', () => {
  test('creates a task and returns it in the envelope (201)', async () => {
    const res = await createFor(alice, { topicId: alice.topic.id });

    assert.equal(res.status, 201);
    assertEnvelope(res);
    assert.equal(res.body.success, true);
    const { task } = res.body.data;
    assert.equal(task.title, 'Lab 1');
    assert.equal(task.status, 'TODO');
    assert.equal(task.courseId, alice.course.id);
    assert.deepEqual(task.course, { id: alice.course.id, code: 'CS101', name: 'Programming' });
    assert.deepEqual(task.topic, { id: alice.topic.id, title: 'Chapter 1' });
    assert.equal(task.userId, undefined); // never leak the owner column
    assert.equal(prisma.tasks[0].userId, alice.user.id);
  });

  test('rejects missing title / dueAt / courseId with VALIDATION_ERROR', async () => {
    const res = await alice.as(request(app).post('/api/tasks')).send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.match(res.body.error.message, /title/);
    assert.match(res.body.error.message, /dueAt/);
    assert.match(res.body.error.message, /courseId/);
  });

  test("answers 404 for another user's course or topic", async () => {
    const course = await createFor(alice, { courseId: bob.course.id });
    assert.equal(course.status, 404);
    assert.equal(course.body.error.code, 'NOT_FOUND');

    const topic = await createFor(alice, { topicId: bob.topic.id });
    assert.equal(topic.status, 404);
    assert.equal(prisma.tasks.length, 0);
  });

  test('requires a bearer token', async () => {
    const res = await request(app).post('/api/tasks').send({});
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});

describe('GET /api/tasks', () => {
  beforeEach(async () => {
    await createFor(alice, { title: 'Later', dueAt: inDays(10) });
    await createFor(alice, { title: 'Soon', dueAt: inDays(1), status: 'DOING' });
    await createFor(bob, { title: 'Bob only' });
  });

  test('lists only the caller tasks, soonest first', async () => {
    const res = await alice.as(request(app).get('/api/tasks'));
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.tasks.map((t) => t.title),
      ['Soon', 'Later'],
    );
  });

  test('filters by course_id (or courseId) and status', async () => {
    const byStatus = await alice.as(request(app).get('/api/tasks?status=DOING'));
    assert.deepEqual(
      byStatus.body.data.tasks.map((t) => t.title),
      ['Soon'],
    );

    const byCourse = await alice.as(request(app).get(`/api/tasks?course_id=${alice.course.id}`));
    assert.equal(byCourse.body.data.tasks.length, 2);
    const alias = await alice.as(request(app).get(`/api/tasks?courseId=${alice.course.id}`));
    assert.equal(alias.body.data.tasks.length, 2);

    // Bob's course never shows Bob's tasks to Alice.
    const foreign = await alice.as(request(app).get(`/api/tasks?course_id=${bob.course.id}`));
    assert.deepEqual(foreign.body.data.tasks, []);
  });

  test('rejects bad filters', async () => {
    const res = await alice.as(request(app).get('/api/tasks?status=LATER&course_id=abc'));
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('PATCH /api/tasks/:id', () => {
  test('changes the status (and only the given fields)', async () => {
    const { body } = await createFor(alice);
    const res = await alice.as(request(app).patch(`/api/tasks/${body.data.task.id}`)).send({ status: 'DONE' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.task.status, 'DONE');
    assert.equal(res.body.data.task.title, 'Lab 1');
  });

  test('rejects an empty body and unknown keys', async () => {
    const { body } = await createFor(alice);
    const empty = await alice.as(request(app).patch(`/api/tasks/${body.data.task.id}`)).send({});
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error.code, 'VALIDATION_ERROR');

    const unknown = await alice.as(request(app).patch(`/api/tasks/${body.data.task.id}`)).send({ due_at: inDays(1) });
    assert.equal(unknown.status, 400);
    assert.match(unknown.body.error.message, /due_at/);
  });

  test("answers 404 for another user's task and for unknown ids", async () => {
    const { body } = await createFor(bob);
    const foreign = await alice.as(request(app).patch(`/api/tasks/${body.data.task.id}`)).send({ status: 'DONE' });
    assert.equal(foreign.status, 404);
    assert.equal(foreign.body.error.code, 'NOT_FOUND');
    assert.equal(prisma.tasks[0].status, 'TODO');

    const missing = await alice.as(request(app).patch('/api/tasks/999')).send({ status: 'DONE' });
    assert.equal(missing.status, 404);
  });

  test('rejects a non-numeric id', async () => {
    const res = await alice.as(request(app).patch('/api/tasks/abc')).send({ status: 'DONE' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('PUT /api/tasks/:id', () => {
  test('replaces the task; omitted optional fields fall back to defaults', async () => {
    const { body } = await createFor(alice, { topicId: alice.topic.id, status: 'DOING' });
    const res = await alice
      .as(request(app).put(`/api/tasks/${body.data.task.id}`))
      .send({ title: 'Lab 1 (revised)', dueAt: inDays(5), courseId: alice.course.id });

    assert.equal(res.status, 200);
    const { task } = res.body.data;
    assert.equal(task.title, 'Lab 1 (revised)');
    assert.equal(task.status, 'TODO');
    assert.equal(task.topicId, null);
    assert.equal(task.topic, null);
  });

  test('validates the full body', async () => {
    const { body } = await createFor(alice);
    const res = await alice.as(request(app).put(`/api/tasks/${body.data.task.id}`)).send({ title: 'x' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('DELETE /api/tasks/:id', () => {
  test('deletes own task and returns its id', async () => {
    const { body } = await createFor(alice);
    const res = await alice.as(request(app).delete(`/api/tasks/${body.data.task.id}`));

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, { id: body.data.task.id });
    assert.equal(prisma.tasks.length, 0);
  });

  test("answers 404 for another user's task", async () => {
    const { body } = await createFor(bob);
    const res = await alice.as(request(app).delete(`/api/tasks/${body.data.task.id}`));
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(prisma.tasks.length, 1);
  });
});
