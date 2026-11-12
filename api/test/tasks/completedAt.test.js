// WBS 3.4 — tasks.completed_at follows the status (used by the analytics endpoints).
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');
const { completedAtFor } = require('../../src/tasks/taskRepo');

describe('completedAtFor', () => {
  const now = new Date('2026-11-12T10:00:00Z');

  test('entering DONE stamps now, staying DONE keeps it, leaving DONE clears it', () => {
    assert.equal(completedAtFor(null, 'DONE', now), now);
    assert.equal(completedAtFor('TODO', 'DONE', now), now);
    assert.equal(completedAtFor('DONE', 'DONE', now), undefined); // unchanged
    assert.equal(completedAtFor('DONE', 'TODO', now), null);
    assert.equal(completedAtFor('TODO', 'DOING', now), null);
  });
});

describe('tasks API sets completedAt', () => {
  let app;
  let as;
  let courseId;

  beforeEach(async () => {
    const prisma = createFakePrisma();
    app = createApp({ prisma });
    const res = await request(app).post('/api/auth/register').send({ email: 'a@sfsh.dev', password: 'Password123!' });
    const user = prisma.users[0];
    courseId = (await prisma.course.create({ data: { userId: user.id, name: 'Physics' } })).id;
    as = (req) => req.set('Authorization', `Bearer ${res.body.data.token}`);
  });

  const create = (body = {}) =>
    as(request(app).post('/api/tasks')).send({ title: 'Lab', dueAt: '2026-11-20T23:59:00+07:00', courseId, ...body });
  const patch = (id, body) => as(request(app).patch(`/api/tasks/${id}`)).send(body);

  test('open tasks have completedAt null', async () => {
    const res = await create();
    assert.equal(res.body.data.task.completedAt, null);
  });

  test('PATCH to DONE stamps it, editing a DONE task keeps it, reopening clears it', async () => {
    const { id } = (await create()).body.data.task;

    const before = Date.now();
    const done = (await patch(id, { status: 'DONE' })).body.data.task;
    const stamped = new Date(done.completedAt).getTime();
    assert.ok(stamped >= before && stamped <= Date.now());

    const renamed = (await patch(id, { title: 'Lab (final)', status: 'DONE' })).body.data.task;
    assert.equal(renamed.completedAt, done.completedAt);

    const reopened = (await patch(id, { status: 'DOING' })).body.data.task;
    assert.equal(reopened.completedAt, null);
  });

  test('creating a task as DONE stamps it; clients cannot send completedAt', async () => {
    const res = await create({ status: 'DONE' });
    assert.ok(res.body.data.task.completedAt);

    const rejected = await create({ completedAt: '2026-01-01T00:00:00Z' });
    assert.equal(rejected.status, 400);
    assert.equal(rejected.body.error.code, 'VALIDATION_ERROR');
  });
});
