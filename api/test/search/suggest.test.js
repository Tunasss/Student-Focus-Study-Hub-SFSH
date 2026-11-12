// WBS 3.4 — GET /api/search/suggest: search-as-you-type over courses, tasks and topics.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');
const { fold, matchRank } = require('../../src/search/suggest');

describe('fold / matchRank', () => {
  test('fold drops case, Vietnamese diacritics and extra spaces', () => {
    assert.equal(fold('  Cấu   trúc Dữ liệu '), 'cau truc du lieu');
    assert.equal(fold('Đại số'), 'dai so');
  });

  test('ranks exact < prefix < word prefix < substring', () => {
    assert.equal(matchRank('Databases', 'databases'), 0);
    assert.equal(matchRank('Databases', 'data'), 1);
    assert.equal(matchRank('Intro to Databases', 'data'), 2);
    assert.equal(matchRank('Metadata', 'data'), 3);
    assert.equal(matchRank('Physics', 'data'), null);
  });
});

describe('GET /api/search/suggest', () => {
  let prisma;
  let app;
  let alice;
  let bob;

  async function signUp(email) {
    const res = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
    const user = prisma.users.find((u) => u.email === email);
    return { user, get: (qs) => request(app).get(`/api/search/suggest${qs}`).set('Authorization', `Bearer ${res.body.data.token}`) };
  }

  beforeEach(async () => {
    prisma = createFakePrisma();
    app = createApp({ prisma });
    alice = await signUp('alice@sfsh.dev');
    bob = await signUp('bob@sfsh.dev');

    const db = await prisma.course.create({ data: { userId: alice.user.id, code: 'CS202', name: 'Databases' } });
    const ds = await prisma.course.create({ data: { userId: alice.user.id, code: 'CS201', name: 'Cấu trúc Dữ liệu' } });
    await prisma.topic.create({ data: { courseId: db.id, sortOrder: 1, title: 'Intro to Databases', status: 'DOING' } });
    await prisma.topic.create({ data: { courseId: ds.id, sortOrder: 1, title: 'Cây nhị phân' } });
    await prisma.task.create({
      data: { userId: alice.user.id, courseId: db.id, title: 'Metadata report', dueAt: new Date('2026-11-20T10:00:00Z') },
    });
    await prisma.task.create({
      data: { userId: alice.user.id, courseId: ds.id, title: 'Data structures lab', dueAt: new Date('2026-11-18T10:00:00Z') },
    });

    const bobCourse = await prisma.course.create({ data: { userId: bob.user.id, code: 'BOB1', name: 'Data Science (Bob)' } });
    await prisma.task.create({ data: { userId: bob.user.id, courseId: bobCourse.id, title: 'Data secret', dueAt: new Date() } });
  });

  test('suggests courses, tasks and topics, best matches first', async () => {
    const res = await alice.get('?q=data');
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body).sort(), ['data', 'error', 'success', 'timestamp']);
    assert.equal(res.body.data.query, 'data');
    assert.deepEqual(
      res.body.data.suggestions.map((s) => [s.type, s.label]),
      [
        ['COURSE', 'Databases'], // prefix, shortest
        ['TASK', 'Data structures lab'], // prefix
        ['TOPIC', 'Intro to Databases'], // word prefix
        ['TASK', 'Metadata report'], // substring
      ],
    );
  });

  test('each suggestion carries its course, status and dueAt', async () => {
    const [course, task, topic] = (await alice.get('?q=data')).body.data.suggestions;
    assert.deepEqual(course, {
      type: 'COURSE',
      id: course.id,
      label: 'Databases',
      courseId: course.id,
      courseCode: 'CS202',
      courseName: 'Databases',
      status: null,
      dueAt: null,
    });
    assert.equal(task.courseName, 'Cấu trúc Dữ liệu');
    assert.equal(task.status, 'TODO');
    assert.equal(task.dueAt, '2026-11-18T10:00:00.000Z');
    assert.equal(topic.status, 'DOING');
    assert.equal(topic.dueAt, null);
  });

  test('matches course codes and ignores Vietnamese diacritics', async () => {
    const byCode = (await alice.get('?q=cs201')).body.data.suggestions;
    assert.deepEqual(byCode.map((s) => s.label), ['Cấu trúc Dữ liệu']);

    const noAccents = (await alice.get('?q=cay nhi')).body.data.suggestions;
    assert.deepEqual(noAccents.map((s) => [s.type, s.label]), [['TOPIC', 'Cây nhị phân']]);
  });

  test("never returns another user's rows", async () => {
    const labels = (await alice.get('?q=data&limit=20')).body.data.suggestions.map((s) => s.label);
    assert.ok(!labels.some((l) => /bob|secret/i.test(l)), labels.join());

    const bobs = (await bob.get('?q=data')).body.data.suggestions.map((s) => s.label);
    assert.deepEqual(bobs, ['Data secret', 'Data Science (Bob)']);
  });

  test('limit caps the list; no match is an empty list', async () => {
    assert.equal((await alice.get('?q=a&limit=2')).body.data.suggestions.length, 2);
    assert.deepEqual((await alice.get('?q=zzz')).body.data.suggestions, []);
  });

  test('validates q and limit', async () => {
    for (const qs of ['', '?q=', '?q=%20%20', `?q=${'x'.repeat(101)}`, '?q=a&limit=0', '?q=a&limit=21', '?q=a&limit=x']) {
      const res = await alice.get(qs);
      assert.equal(res.status, 400, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
  });

  test('requires a bearer token', async () => {
    const res = await request(app).get('/api/search/suggest?q=data');
    assert.equal(res.status, 401);
  });
});
