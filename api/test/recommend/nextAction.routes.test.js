// WBS 3.1.3 — GET /api/recommendation/next-action: TASK / TOPIC / EMPTY answers with the score breakdown.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');
const { timeToDb } = require('../../src/ics/time');
const { KIND, EMPTY_REASON, serializeNextAction } = require('../../src/recommend/nextAction');

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
  const as = (req) => req.set('Authorization', `Bearer ${res.body.data.token}`);
  return { user, course, as };
}

beforeEach(async () => {
  prisma = createFakePrisma();
  app = createApp({ prisma });
  alice = await signUp('alice@sfsh.dev');
  bob = await signUp('bob@sfsh.dev');
});

const addTopic = (course, data) =>
  prisma.topic.create({ data: { courseId: course.id, sortOrder: 1, title: 'Chapter 1', status: 'TODO', ...data } });

const addTask = (who, body = {}) =>
  who.as(request(app).post('/api/tasks')).send({ title: 'Lab 1', dueAt: inDays(2), courseId: who.course.id, ...body });

// A weekly slot `daysFromNow` days ahead at 09:00 Asia/Ho_Chi_Minh.
async function addSlot(course, daysFromNow) {
  const date = new Date(Date.now() + daysFromNow * DAY);
  const dayOfWeek = ((date.getUTCDay() + 6) % 7) + 1; // JS 0=Sunday -> ISO 1=Monday..7=Sunday
  await prisma.schedule.createMany({
    data: [
      {
        courseId: course.id,
        dayOfWeek,
        startTime: timeToDb('09:00:00'),
        endTime: timeToDb('11:00:00'),
        tz: 'Asia/Ho_Chi_Minh',
        intervalWeeks: 1,
        startsAtUtc: null,
        endsAtUtc: null,
        icsUid: null,
      },
    ],
  });
}

const getNext = (who = alice, qs = '') => who.as(request(app).get(`/api/recommendation/next-action${qs}`));

const SHAPE = ['course', 'kind', 'nextClass', 'openTaskCount', 'reason', 'score', 'scoreBreakdown', 'task', 'topic', 'topicAutoLinked'];

describe('GET /api/recommendation/next-action', () => {
  test('kind TASK: the best open task with its score breakdown and an explanation', async () => {
    const doing = await addTopic(alice.course, { title: 'Chapter 1', status: 'DOING' });
    await addTask(alice, { title: 'Far away', dueAt: inDays(20) });
    const best = (await addTask(alice, { title: 'Lab 1', dueAt: inDays(-1), topicId: doing.id })).body.data.task;
    await addTask(alice, { title: 'Finished', dueAt: inDays(-3), status: 'DONE' });

    const res = await getNext();

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const { data } = res.body;
    assert.deepEqual(Object.keys(data).sort(), SHAPE);
    assert.equal(data.kind, KIND.TASK);
    assert.equal(data.task.id, best.id);
    assert.equal(data.task.title, 'Lab 1');
    assert.equal(data.task.urgencyBadge, 'OVERDUE');
    assert.equal(data.task.daysLeft, -1);
    assert.deepEqual(data.topic, { id: doing.id, title: 'Chapter 1', status: 'DOING' });
    assert.equal(data.topicAutoLinked, false);
    assert.deepEqual(data.course, { id: alice.course.id, code: 'CS101', name: 'Programming' });
    assert.equal(data.score, 28); // 20 + 5 + 3
    assert.deepEqual(data.scoreBreakdown, { baseUrgencyScore: 20, topicDoingBonus: 5, overdueBonus: 3 });
    assert.equal(data.openTaskCount, 2);
    assert.equal(data.nextClass, null);
    assert.match(data.reason, /Top of 2 open task\(s\)/);
    assert.match(data.reason, /overdue by 1 day\(s\) \(\+20\)/);
    assert.match(data.reason, /on "Chapter 1", in progress \(\+5\)/);
    assert.match(data.reason, /overdue bonus \(\+3\) = 28\./);
  });

  test('kind TASK: a task without topic is auto-linked for the score and flagged', async () => {
    await addTopic(alice.course, { title: 'Chapter 1', status: 'DONE', sortOrder: 1 });
    const ch2 = await addTopic(alice.course, { title: 'Chapter 2', status: 'TODO', sortOrder: 2 });
    await addTask(alice, { title: 'Essay', dueAt: inDays(2) });

    const { data } = (await getNext()).body;

    assert.equal(data.kind, KIND.TASK);
    assert.equal(data.task.topicId, null); // not persisted
    assert.deepEqual(data.topic, { id: ch2.id, title: 'Chapter 2', status: 'TODO' });
    assert.equal(data.topicAutoLinked, true);
    assert.equal(data.score, 6); // 4 + 2
    assert.match(data.reason, /auto-linked to "Chapter 2", todo \(\+2\)/);
  });

  test('kind TOPIC: no open task -> topic of the course with the nearest class', async () => {
    const math = await prisma.course.create({ data: { userId: alice.user.id, code: 'MATH201', name: 'Calculus' } });
    await addTopic(alice.course, { title: 'CS chapter 1', status: 'DOING' });
    const calc = await addTopic(math, { title: 'Calc chapter 1', status: 'TODO' });
    await addSlot(alice.course, 5);
    await addSlot(math, 2);
    await addTask(alice, { title: 'Finished', dueAt: inDays(-3), status: 'DONE' });

    const { data } = (await getNext()).body;

    assert.deepEqual(Object.keys(data).sort(), SHAPE);
    assert.equal(data.kind, KIND.TOPIC);
    assert.equal(data.task, null);
    assert.equal(data.score, null);
    assert.equal(data.scoreBreakdown, null);
    assert.equal(data.openTaskCount, 0);
    assert.deepEqual(data.topic, { id: calc.id, title: 'Calc chapter 1', status: 'TODO' });
    assert.deepEqual(data.course, { id: math.id, code: 'MATH201', name: 'Calculus' });
    assert.equal(data.nextClass.courseId, math.id);
    assert.match(data.nextClass.start, /T09:00$/);
    assert.match(data.reason, /first TODO topic of Calculus, next class /);
  });

  test('kind TOPIC: `tz` changes the local time of nextClass', async () => {
    await addTopic(alice.course, { status: 'DOING' });
    await addSlot(alice.course, 2);

    const { data } = (await getNext(alice, '?tz=UTC')).body;
    assert.equal(data.kind, KIND.TOPIC);
    assert.match(data.nextClass.start, /T02:00$/); // 09:00 +07:00
  });

  test('kind TOPIC: topics but no timetable still gives a topic, with nextClass null', async () => {
    const t = await addTopic(alice.course, { status: 'TODO' });
    const { data } = (await getNext()).body;
    assert.equal(data.kind, KIND.TOPIC);
    assert.equal(data.topic.id, t.id);
    assert.equal(data.nextClass, null);
    assert.match(data.reason, /no upcoming class on the timetable/);
  });

  test('kind EMPTY: nothing to suggest', async () => {
    await addTask(alice, { title: 'Finished', dueAt: inDays(-3), status: 'DONE' });
    const res = await getNext();

    assert.equal(res.status, 200);
    const { data } = res.body;
    assert.deepEqual(Object.keys(data).sort(), SHAPE);
    assert.equal(data.kind, KIND.EMPTY);
    assert.equal(data.task, null);
    assert.equal(data.topic, null);
    assert.equal(data.course, null);
    assert.equal(data.score, null);
    assert.equal(data.scoreBreakdown, null);
    assert.equal(data.nextClass, null);
    assert.equal(data.openTaskCount, 0);
    assert.equal(data.reason, EMPTY_REASON);
  });

  test("never uses another user's tasks, topics or timetable (Rule 06)", async () => {
    await addTopic(bob.course, { status: 'DOING' });
    await addSlot(bob.course, 1);
    await addTask(bob, { title: 'Bob lab', dueAt: inDays(-1) });

    const { data } = (await getNext(alice)).body;
    assert.equal(data.kind, KIND.EMPTY);
  });

  test('rejects an unknown tz with VALIDATION_ERROR', async () => {
    const res = await getNext(alice, '?tz=Mars/Base');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.match(res.body.error.message, /tz: must be an IANA timezone/);
  });

  test('requires a bearer token', async () => {
    const res = await request(app).get('/api/recommendation/next-action');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});

describe('serializeNextAction', () => {
  test('TASK answers expose the PRD score_breakdown terms in camelCase', () => {
    const now = new Date('2026-11-09T09:00:00.000Z');
    const task = {
      id: 1,
      title: 'Lab',
      dueAt: new Date('2026-11-11T09:00:00.000Z'),
      status: 'TODO',
      courseId: 2,
      topicId: null,
      course: { id: 2, code: 'CS101', name: 'Programming' },
      topic: null,
      createdAt: now,
      userId: 99,
    };
    const ranked = {
      task,
      topic: null,
      topicAutoLinked: false,
      score: 4,
      daysLeft: 2,
      effDays: 2,
      isOverdue: false,
      breakdown: { baseUrgencyScore: 4, topicDoingBonus: 0, overdueBonus: 0 },
    };
    const json = serializeNextAction({ kind: KIND.TASK, ranked, openTaskCount: 1 }, now);
    assert.equal(json.task.userId, undefined);
    assert.equal(json.task.daysLeft, 2);
    assert.deepEqual(json.scoreBreakdown, { baseUrgencyScore: 4, topicDoingBonus: 0, overdueBonus: 0 });
    assert.equal(json.reason, 'Top of 1 open task(s): due in 2 day(s) (+4), no topic to link (+0) = 4.');
  });
});
