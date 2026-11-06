// WBS 2.2.4 — topic persistence endpoints over HTTP (Rule 02 envelope, Rule 06 scoping).
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');

let prisma;
let app;
let alice;
let bob;

async function signUp(email) {
  const res = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
  const user = prisma.users.find((u) => u.email === email);
  const course = await prisma.course.create({ data: { userId: user.id, code: 'CS101', name: 'Programming' } });
  const as = (req) => req.set('Authorization', `Bearer ${res.body.data.token}`);
  return { user, course, as };
}

beforeEach(async () => {
  prisma = createFakePrisma();
  app = createApp({ prisma });
  alice = await signUp('alice@sfsh.dev');
  bob = await signUp('bob@sfsh.dev');
});

// The shape POST /api/syllabus/extract returns for the preview, after the user edited it.
const PREVIEW = [
  { order: 1, title: 'Chapter 1: Introduction', description: 'What programs are.' },
  { order: 2, title: 'Chapter 2: Variables', description: null },
  { order: 3, title: 'Chapter 3: Control flow' },
];

describe('POST /api/courses/:id/topics/bulk', () => {
  test('saves the confirmed preview into the course, mapping order -> sortOrder (201)', async () => {
    const res = await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send({ topics: PREVIEW });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.replaced, 0);
    assert.deepEqual(res.body.data.topics, [
      { id: 1, courseId: alice.course.id, parentId: null, sortOrder: 1, title: 'Chapter 1: Introduction', description: 'What programs are.', sourceFile: null, status: 'TODO' },
      { id: 2, courseId: alice.course.id, parentId: null, sortOrder: 2, title: 'Chapter 2: Variables', description: null, sourceFile: null, status: 'TODO' },
      { id: 3, courseId: alice.course.id, parentId: null, sortOrder: 3, title: 'Chapter 3: Control flow', description: null, sourceFile: null, status: 'TODO' },
    ]);
    assert.equal(prisma.topics[0].sortOrder, 1); // stored in sort_order, never `order`
  });

  test('a second save replaces the list and reports how many topics it replaced', async () => {
    await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send({ topics: PREVIEW });
    const res = await alice
      .as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`))
      .send({ topics: [{ sortOrder: 1, title: 'Only chapter' }] });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.replaced, 3);
    assert.equal(res.body.data.topics.length, 1);
    assert.equal(prisma.topics.length, 1);
  });

  test('saves hierarchical chapters and subtopics in one transaction', async () => {
    const HIERARCHICAL_PREVIEW = {
      mode: 'replace',
      chapters: [
        {
          title: 'Chương 1: Kiến trúc máy tính',
          description: 'Phần cứng cơ bản',
          sourceFile: 'Chuong1.pdf',
          subtopics: [
            { title: '1.1 CPU và Bộ nhớ', description: 'Cấu trúc Von Neumann' },
            { title: '1.2 Bus hệ thống' },
          ],
        },
        {
          title: 'Chương 2: Hệ điều hành',
          description: 'Phần mềm hệ thống',
          sourceFile: 'Chuong2.pdf',
          subtopics: [
            { title: '2.1 Tiến trình và Luồng' },
          ],
        },
      ],
    };

    const res = await alice
      .as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`))
      .send(HIERARCHICAL_PREVIEW);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    const topics = res.body.data.topics;
    assert.equal(topics.length, 5);

    const ch1 = topics.find((t) => t.title === 'Chương 1: Kiến trúc máy tính');
    assert.ok(ch1);
    assert.equal(ch1.parentId, null);
    assert.equal(ch1.sourceFile, 'Chuong1.pdf');
    assert.equal(ch1.sortOrder, 1);

    const sub1 = topics.find((t) => t.title === '1.1 CPU và Bộ nhớ');
    assert.ok(sub1);
    assert.equal(sub1.parentId, ch1.id);
    assert.equal(sub1.sourceFile, 'Chuong1.pdf');
    assert.equal(sub1.sortOrder, 1);

    const sub2 = topics.find((t) => t.title === '1.2 Bus hệ thống');
    assert.ok(sub2);
    assert.equal(sub2.parentId, ch1.id);
    assert.equal(sub2.sortOrder, 2);

    const ch2 = topics.find((t) => t.title === 'Chương 2: Hệ điều hành');
    assert.ok(ch2);
    assert.equal(ch2.parentId, null);
    assert.equal(ch2.sortOrder, 2);

    const sub3 = topics.find((t) => t.title === '2.1 Tiến trình và Luồng');
    assert.ok(sub3);
    assert.equal(sub3.parentId, ch2.id);
    assert.equal(sub3.sortOrder, 1);
  });

  test('mode: append appends chapters without destroying existing topics or breaking linked tasks', async () => {
    await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send({
      mode: 'replace',
      chapters: [
        {
          title: 'Chapter 1: Basics',
          sourceFile: 'ch1.pdf',
          subtopics: [{ title: '1.1 Intro' }],
        },
      ],
    });

    const initial = await alice.as(request(app).get(`/api/courses/${alice.course.id}/topics`));
    const ch1 = initial.body.data.topics.find((t) => t.title === 'Chapter 1: Basics');
    assert.ok(ch1);
    const ch1Id = ch1.id;

    const taskRes = await alice.as(request(app).post('/api/tasks')).send({
      courseId: alice.course.id,
      topicId: ch1Id,
      title: 'Study Chapter 1',
      dueAt: '2026-12-01T10:00:00Z',
    });
    assert.equal(taskRes.status, 201);
    const taskId = taskRes.body.data.task.id;

    const appendRes = await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send({
      mode: 'append',
      chapters: [
        {
          title: 'Chapter 2: Advanced',
          sourceFile: 'ch2.pdf',
          subtopics: [{ title: '2.1 Trees' }],
        },
      ],
    });
    assert.equal(appendRes.status, 201);
    assert.equal(appendRes.body.data.replaced, 0);

    const getTask = await alice.as(request(app).get(`/api/tasks`));
    const task = getTask.body.data.tasks.find((t) => t.id === taskId);
    assert.equal(task.topicId, ch1Id);

    const ch2 = appendRes.body.data.topics.find((t) => t.title === 'Chapter 2: Advanced');
    assert.ok(ch2);
    assert.equal(ch2.sortOrder, 2);
    assert.equal(ch2.parentId, null);
  });

  test('validates the body with zod', async () => {
    const post = (body) => alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send(body);

    const empty = await post({ topics: [] });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error.code, 'VALIDATION_ERROR');
    assert.match(empty.body.error.message, /at least one topic/);

    const noTitle = await post({ topics: [{ order: 1 }] });
    assert.equal(noTitle.status, 400);
    assert.match(noTitle.body.error.message, /topics\.0\.title/);

    const badStatus = await post({ topics: [{ order: 1, title: 'x', status: 'OVERDUE' }] });
    assert.equal(badStatus.status, 400);
    assert.match(badStatus.body.error.message, /status/);

    const unknownKey = await post({ topics: [{ order: 1, title: 'x', sort_order: 1 }] });
    assert.equal(unknownKey.status, 400);
    assert.match(unknownKey.body.error.message, /sort_order/);

    assert.equal(prisma.topics.length, 0);
  });

  test("answers 404 for another user's course", async () => {
    const res = await alice.as(request(app).post(`/api/courses/${bob.course.id}/topics/bulk`)).send({ topics: PREVIEW });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(prisma.topics.length, 0);
  });

  test('requires a bearer token', async () => {
    const res = await request(app).post(`/api/courses/${alice.course.id}/topics/bulk`).send({ topics: PREVIEW });
    assert.equal(res.status, 401);
  });
});

describe('GET /api/courses/:id/topics and POST /api/courses/:id/topics', () => {
  test('lists the course topics in sortOrder', async () => {
    await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send({ topics: PREVIEW });
    const res = await alice.as(request(app).get(`/api/courses/${alice.course.id}/topics`));

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.topics.map((t) => t.sortOrder),
      [1, 2, 3],
    );
  });

  test('creates one topic (manual entry form) at the next position', async () => {
    const res = await alice
      .as(request(app).post(`/api/courses/${alice.course.id}/topics`))
      .send({ title: 'Manual chapter', description: 'typed by the student' });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.topic.sortOrder, 1);
    assert.equal(res.body.data.topic.status, 'TODO');

    const second = await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics`)).send({ title: 'Next', sortOrder: 2 });
    assert.equal(second.body.data.topic.sortOrder, 2);

    const clash = await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics`)).send({ title: 'Clash', sortOrder: 2 });
    assert.equal(clash.status, 409);
    assert.equal(clash.body.error.code, 'SORT_ORDER_TAKEN');
  });

  test("answers 404 for another user's course and 400 for a bad id", async () => {
    const foreign = await alice.as(request(app).get(`/api/courses/${bob.course.id}/topics`));
    assert.equal(foreign.status, 404);
    const bad = await alice.as(request(app).get('/api/courses/abc/topics'));
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('PATCH /api/topics/:id', () => {
  let topicId;

  beforeEach(async () => {
    const res = await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send({ topics: PREVIEW });
    topicId = res.body.data.topics[0].id;
  });

  test('changes the learning status', async () => {
    for (const status of ['DOING', 'DONE', 'TODO']) {
      const res = await alice.as(request(app).patch(`/api/topics/${topicId}`)).send({ status });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.topic.status, status);
    }
  });

  test('quick-edits title and description', async () => {
    const res = await alice
      .as(request(app).patch(`/api/topics/${topicId}`))
      .send({ title: '  Chapter 1: Intro (edited)  ', description: '' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.topic.title, 'Chapter 1: Intro (edited)');
    assert.equal(res.body.data.topic.description, null);
    assert.equal(res.body.data.topic.sortOrder, 1);
  });

  test('rejects an empty patch, OVERDUE status and unknown keys', async () => {
    const empty = await alice.as(request(app).patch(`/api/topics/${topicId}`)).send({});
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error.code, 'VALIDATION_ERROR');

    const overdue = await alice.as(request(app).patch(`/api/topics/${topicId}`)).send({ status: 'OVERDUE' });
    assert.equal(overdue.status, 400);

    const order = await alice.as(request(app).patch(`/api/topics/${topicId}`)).send({ sortOrder: 9 });
    assert.equal(order.status, 400);
  });

  test("answers 404 for another user's topic (row untouched)", async () => {
    const res = await bob.as(request(app).patch(`/api/topics/${topicId}`)).send({ status: 'DONE' });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(prisma.topics.find((t) => t.id === topicId).status, 'TODO');
  });
});

describe('DELETE /api/topics/:id', () => {
  test('deletes an own topic and returns its id; 404 for others', async () => {
    const saved = await alice.as(request(app).post(`/api/courses/${alice.course.id}/topics/bulk`)).send({ topics: PREVIEW });
    const id = saved.body.data.topics[2].id;

    const foreign = await bob.as(request(app).delete(`/api/topics/${id}`));
    assert.equal(foreign.status, 404);

    const res = await alice.as(request(app).delete(`/api/topics/${id}`));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, { id });
    assert.equal(prisma.topics.length, 2);
  });
});
