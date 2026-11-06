// WBS 2.4a.4 — zod input validation for the tasks endpoints (VALIDATION_ERROR on missing / malformed input).
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { parseOrThrow } = require('../../src/validation');
const { taskInputSchema, taskPatchSchema, listQuerySchema, idParamSchema } = require('../../src/tasks/schemas');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');

function expectValidationError(fn, pattern) {
  assert.throws(fn, (err) => {
    assert.equal(err.status, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
    if (pattern) assert.match(err.message, pattern);
    return true;
  });
}

const valid = { title: 'Lab 1', dueAt: '2026-11-20T23:59:00+07:00', courseId: 3 };

describe('taskInputSchema (POST / PUT body)', () => {
  test('accepts a valid body, trims the title and converts dueAt to a Date', () => {
    const data = parseOrThrow(taskInputSchema, { ...valid, title: '  Lab 1  ' });
    assert.equal(data.title, 'Lab 1');
    assert.ok(data.dueAt instanceof Date);
    assert.equal(data.dueAt.toISOString(), '2026-11-20T16:59:00.000Z');
    assert.equal(data.topicId, null);
    assert.equal(data.status, 'TODO');
  });

  test('accepts Z (UTC) date-times and optional topicId / status', () => {
    const data = parseOrThrow(taskInputSchema, { ...valid, dueAt: '2026-11-20T16:59:00Z', topicId: 5, status: 'DOING' });
    assert.equal(data.dueAt.toISOString(), '2026-11-20T16:59:00.000Z');
    assert.equal(data.topicId, 5);
    assert.equal(data.status, 'DOING');
  });

  test('reports every missing required field', () => {
    expectValidationError(() => parseOrThrow(taskInputSchema, {}), /title.*dueAt.*courseId/s);
  });

  test('rejects an empty or too long title', () => {
    expectValidationError(() => parseOrThrow(taskInputSchema, { ...valid, title: '   ' }), /title: must not be empty/);
    expectValidationError(() => parseOrThrow(taskInputSchema, { ...valid, title: 'x'.repeat(256) }), /title: .*255/);
  });

  test('rejects dueAt without a timezone, a date-only value, or garbage', () => {
    for (const dueAt of ['2026-11-20T23:59:00', '2026-11-20', 'tomorrow', 1700000000, null]) {
      expectValidationError(() => parseOrThrow(taskInputSchema, { ...valid, dueAt }), /dueAt: must be an ISO-8601/);
    }
  });

  test('rejects a non-integer, zero, negative or string courseId / topicId', () => {
    for (const courseId of ['3', 0, -1, 1.5, null]) {
      expectValidationError(() => parseOrThrow(taskInputSchema, { ...valid, courseId }), /courseId: must be a positive integer/);
    }
    expectValidationError(() => parseOrThrow(taskInputSchema, { ...valid, topicId: 0 }), /topicId/);
  });

  test('rejects an unknown status', () => {
    expectValidationError(() => parseOrThrow(taskInputSchema, { ...valid, status: 'URGENT' }), /status: must be one of TODO, DOING, DONE, OVERDUE/);
  });

  test('rejects unknown keys (e.g. snake_case field names)', () => {
    expectValidationError(() => parseOrThrow(taskInputSchema, { ...valid, due_at: valid.dueAt }), /due_at/);
  });

  test('rejects a non-object body', () => {
    expectValidationError(() => parseOrThrow(taskInputSchema, undefined));
    expectValidationError(() => parseOrThrow(taskInputSchema, 'title=Lab'));
  });
});

describe('taskPatchSchema (PATCH body)', () => {
  test('accepts any subset of fields', () => {
    assert.deepEqual(parseOrThrow(taskPatchSchema, { status: 'DONE' }), { status: 'DONE' });
    assert.deepEqual(parseOrThrow(taskPatchSchema, { topicId: null }), { topicId: null });
    const data = parseOrThrow(taskPatchSchema, { title: 'New', dueAt: '2026-12-01T00:00:00Z' });
    assert.equal(data.title, 'New');
    assert.ok(data.dueAt instanceof Date);
  });

  test('rejects an empty patch', () => {
    expectValidationError(() => parseOrThrow(taskPatchSchema, {}), /at least one field is required/);
  });

  test('applies the same field rules as the create schema', () => {
    expectValidationError(() => parseOrThrow(taskPatchSchema, { title: '' }), /title/);
    expectValidationError(() => parseOrThrow(taskPatchSchema, { dueAt: '2026-12-01' }), /dueAt/);
    expectValidationError(() => parseOrThrow(taskPatchSchema, { status: 'LATER' }), /status/);
    expectValidationError(() => parseOrThrow(taskPatchSchema, { courseId: 'abc' }), /courseId/);
    expectValidationError(() => parseOrThrow(taskPatchSchema, { extra: 1 }), /extra/);
  });
});

describe('listQuerySchema (GET /api/tasks query)', () => {
  test('coerces course_id (or courseId) to an integer and keeps status', () => {
    assert.deepEqual(parseOrThrow(listQuerySchema, { course_id: '7', status: 'DOING' }), { courseId: 7, status: 'DOING' });
    assert.deepEqual(parseOrThrow(listQuerySchema, { courseId: '7' }), { courseId: 7, status: undefined });
    assert.deepEqual(parseOrThrow(listQuerySchema, {}), { courseId: undefined, status: undefined });
  });

  test('course_id wins over the courseId alias', () => {
    assert.equal(parseOrThrow(listQuerySchema, { course_id: '1', courseId: '2' }).courseId, 1);
  });

  test('rejects a non-numeric or non-positive course_id and an unknown status', () => {
    expectValidationError(() => parseOrThrow(listQuerySchema, { course_id: 'abc' }), /course_id: must be a positive integer/);
    expectValidationError(() => parseOrThrow(listQuerySchema, { course_id: '0' }), /course_id/);
    expectValidationError(() => parseOrThrow(listQuerySchema, { status: 'done' }), /status/);
  });
});

describe('idParamSchema (/:id)', () => {
  test('coerces a numeric path param', () => {
    assert.deepEqual(parseOrThrow(idParamSchema, { id: '42' }), { id: 42 });
  });

  test('rejects non-numeric, fractional or non-positive ids', () => {
    for (const id of ['abc', '1.5', '0', '-3', '']) {
      expectValidationError(() => parseOrThrow(idParamSchema, { id }), /id: must be a positive integer/);
    }
  });
});

describe('HTTP: invalid input answers 400 VALIDATION_ERROR in the envelope', () => {
  let prisma;
  let app;
  let as;
  let courseId;

  beforeEach(async () => {
    prisma = createFakePrisma();
    app = createApp({ prisma });
    const res = await request(app).post('/api/auth/register').send({ email: 'v@sfsh.dev', password: 'Password123!' });
    as = (req) => req.set('Authorization', `Bearer ${res.body.data.token}`);
    courseId = (await prisma.course.create({ data: { userId: prisma.users[0].id, name: 'CS101' } })).id;
  });

  test('POST with a date-only dueAt', async () => {
    const res = await as(request(app).post('/api/tasks')).send({ title: 'Lab', dueAt: '2026-11-20', courseId });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.data, null);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.match(res.body.error.message, /^dueAt: /);
    assert.equal(prisma.tasks.length, 0);
  });

  test('POST with malformed JSON answers INVALID_JSON', async () => {
    const res = await as(request(app).post('/api/tasks')).set('Content-Type', 'application/json').send('{"title":');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_JSON');
  });

  test('every task in a response carries daysLeft and urgencyBadge', async () => {
    const DAY = 24 * 60 * 60 * 1000;
    const created = await as(request(app).post('/api/tasks')).send({
      title: 'Lab',
      dueAt: new Date(Date.now() + 10 * DAY).toISOString(),
      courseId,
    });
    assert.equal(created.body.data.task.daysLeft, 10);
    assert.equal(created.body.data.task.urgencyBadge, 'LATER');

    const done = await as(request(app).patch(`/api/tasks/${created.body.data.task.id}`)).send({ status: 'DONE' });
    assert.equal(done.body.data.task.urgencyBadge, null);

    const list = await as(request(app).get('/api/tasks'));
    assert.deepEqual(
      list.body.data.tasks.map((t) => [t.daysLeft, t.urgencyBadge]),
      [[10, null]],
    );
  });
});
