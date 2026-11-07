// WBS 3.1.4 — the five mandatory recommendation test cases, run through the whole algorithm
// (scoreUserTasks -> rankTasks -> nextAction) against the in-memory Prisma stand-in, with a fixed clock.
//
//   Case 1: deadline in 2 days, linked to a DOING topic
//   Case 2: an OVERDUE task
//   Case 3: a task with topic_id = null
//   Case 4: two tasks with the same score (tie-break on due_at / created_at)
//   Case 5: no open task left
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFakePrisma } = require('../helpers');
const { createTask } = require('../../src/tasks/taskRepo');
const { timeToDb } = require('../../src/ics/time');
const { scoreUserTasks } = require('../../src/recommend/recommendRepo');
const { nextAction, serializeNextAction, KIND } = require('../../src/recommend/nextAction');

// Monday 2026-11-09 09:00 UTC (16:00 in Asia/Ho_Chi_Minh).
const NOW = new Date('2026-11-09T09:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const at = (days) => new Date(NOW.getTime() + days * DAY);

let prisma;
let user;
let course;
let bare;

beforeEach(async () => {
  prisma = createFakePrisma();
  user = await prisma.user.create({ data: { email: 'student@sfsh.dev', passwordHash: 'x' } });
  course = await prisma.course.create({ data: { userId: user.id, code: 'CS101', name: 'Databases' } });
  bare = await prisma.course.create({ data: { userId: user.id, code: 'PHY100', name: 'Physics' } });
});

const addTopic = (data) => prisma.topic.create({ data: { courseId: course.id, sortOrder: 1, title: 'Chapter', ...data } });

// Creates a task through the real data layer, then pins its created_at for deterministic tie-breaks.
async function addTask({ title, dueInDays, topicId = null, status = 'TODO', createdDaysAgo = 1, courseId = course.id }) {
  const task = await createTask(prisma, user.id, { title, dueAt: at(dueInDays), courseId, topicId, status });
  prisma.tasks.find((row) => row.id === task.id).createdAt = at(-createdDaysAgo);
  return task;
}

const recommend = async () => serializeNextAction(await nextAction(prisma, user.id, { now: NOW }), NOW);

describe('Case 1: deadline in 2 days linked to a DOING topic', () => {
  test('scores 10/(2+0.5) + 5 = 9 and is the recommended task', async () => {
    const doing = await addTopic({ title: 'Chapter 2: SQL Basics', status: 'DOING' });
    const task = await addTask({ title: 'Bài tập 1', dueInDays: 2, topicId: doing.id });

    const [ranked] = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked.task.id, task.id);
    assert.equal(ranked.daysLeft, 2);
    assert.equal(ranked.isOverdue, false);
    assert.deepEqual(ranked.breakdown, { baseUrgencyScore: 4, topicDoingBonus: 5, overdueBonus: 0 });
    assert.equal(ranked.score, 9);

    const answer = await recommend();
    assert.equal(answer.kind, KIND.TASK);
    assert.equal(answer.task.id, task.id);
    assert.equal(answer.task.urgencyBadge, 'URGENT');
    assert.deepEqual(answer.topic, { id: doing.id, title: 'Chapter 2: SQL Basics', status: 'DOING' });
    assert.equal(answer.score, 9);
    assert.deepEqual(answer.scoreBreakdown, { baseUrgencyScore: 4, topicDoingBonus: 5, overdueBonus: 0 });
  });

  test('the DOING link is worth 3 points more than the same deadline on a TODO topic', async () => {
    const doing = await addTopic({ title: 'Doing', status: 'DOING', sortOrder: 1 });
    const todo = await addTopic({ title: 'Todo', status: 'TODO', sortOrder: 2 });
    await addTask({ title: 'On TODO', dueInDays: 2, topicId: todo.id });
    await addTask({ title: 'On DOING', dueInDays: 2, topicId: doing.id });

    const ranked = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.deepEqual(
      ranked.map((r) => [r.task.title, r.score]),
      [
        ['On DOING', 9],
        ['On TODO', 6],
      ],
    );
  });
});

describe('Case 2: an OVERDUE task', () => {
  test('counts as due now (eff_days 0 -> 20) and gets the +3 overdue bonus', async () => {
    const doing = await addTopic({ title: 'Chapter 2', status: 'DOING' });
    const overdue = await addTask({ title: 'Late lab', dueInDays: -1, topicId: doing.id });

    const [ranked] = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked.task.id, overdue.id);
    assert.equal(ranked.daysLeft, -1);
    assert.equal(ranked.effDays, 0);
    assert.equal(ranked.isOverdue, true);
    assert.deepEqual(ranked.breakdown, { baseUrgencyScore: 20, topicDoingBonus: 5, overdueBonus: 3 });
    assert.equal(ranked.score, 28);

    const answer = await recommend();
    assert.equal(answer.kind, KIND.TASK);
    assert.equal(answer.task.urgencyBadge, 'OVERDUE');
    assert.equal(answer.scoreBreakdown.overdueBonus, 3);
    assert.match(answer.reason, /overdue by 1 day\(s\) \(\+20\)/);
    assert.match(answer.reason, /overdue bonus \(\+3\)/);
  });

  test('an overdue task outranks a task due in 2 days on the same DOING topic (23 > 9)', async () => {
    const doing = await addTopic({ title: 'Chapter 2', status: 'DOING' });
    const soon = await addTask({ title: 'Soon', dueInDays: 2, topicId: doing.id });
    const overdue = await addTask({ title: 'Overdue, no topic', dueInDays: -3, courseId: bare.id });

    const ranked = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.deepEqual(
      ranked.map((r) => [r.task.id, r.score]),
      [
        [overdue.id, 23], // 20 + 0 + 3
        [soon.id, 9],
      ],
    );
  });

  test('a task that was overdue but is DONE is ignored', async () => {
    await addTask({ title: 'Late but finished', dueInDays: -2, status: 'DONE' });
    assert.deepEqual(await scoreUserTasks(prisma, user.id, { now: NOW }), []);
  });
});

describe('Case 3: a task with topic_id = null', () => {
  test('is auto-linked to the first open topic of its course (DOING -> +5, TODO -> +2) without saving the link', async () => {
    await addTopic({ title: 'Chapter 1', status: 'DONE', sortOrder: 1 });
    const ch2 = await addTopic({ title: 'Chapter 2', status: 'TODO', sortOrder: 2 });
    await addTopic({ title: 'Chapter 3', status: 'DOING', sortOrder: 3 });
    const task = await addTask({ title: 'Essay', dueInDays: 2 });

    const [ranked] = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked.task.topicId, null);
    assert.equal(ranked.topic.id, ch2.id); // first not-DONE topic in syllabus order, not the DOING one
    assert.equal(ranked.topicAutoLinked, true);
    assert.deepEqual(ranked.breakdown, { baseUrgencyScore: 4, topicDoingBonus: 2, overdueBonus: 0 });
    assert.equal(ranked.score, 6);

    assert.equal(prisma.tasks.find((row) => row.id === task.id).topicId, null, 'the link must not be persisted');

    const answer = await recommend();
    assert.equal(answer.task.topicId, null);
    assert.deepEqual(answer.topic, { id: ch2.id, title: 'Chapter 2', status: 'TODO' });
    assert.equal(answer.topicAutoLinked, true);
    assert.match(answer.reason, /auto-linked to "Chapter 2"/);
  });

  test('gets +5 when the first open topic of the course is DOING', async () => {
    await addTopic({ title: 'Chapter 1', status: 'DOING', sortOrder: 1 });
    await addTask({ title: 'Essay', dueInDays: 2 });
    const [ranked] = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked.breakdown.topicDoingBonus, 5);
    assert.equal(ranked.score, 9);
  });

  test('gets 0 topic points when the course has no topic at all', async () => {
    const task = await addTask({ title: 'Quiz', dueInDays: 2, courseId: bare.id });

    const [ranked] = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked.task.id, task.id);
    assert.equal(ranked.topic, null);
    assert.equal(ranked.topicAutoLinked, false);
    assert.deepEqual(ranked.breakdown, { baseUrgencyScore: 4, topicDoingBonus: 0, overdueBonus: 0 });
    assert.equal(ranked.score, 4);

    const answer = await recommend();
    assert.equal(answer.topic, null);
    assert.match(answer.reason, /no topic to link \(\+0\)/);
  });

  test('gets 0 topic points when every topic of the course is DONE', async () => {
    await addTopic({ title: 'Chapter 1', status: 'DONE' });
    await addTask({ title: 'Essay', dueInDays: 2 });
    const [ranked] = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked.topic, null);
    assert.equal(ranked.score, 4);
  });
});

describe('Case 4: two tasks with the same score (tie-break)', () => {
  test('same score, different due_at: the sooner deadline wins', async () => {
    // Both overdue on the same DOING topic -> both 28. "Older deadline" is due 3 days ago, "newer" 1 day ago.
    const doing = await addTopic({ title: 'Chapter 2', status: 'DOING' });
    const newerDeadline = await addTask({ title: 'Due yesterday', dueInDays: -1, topicId: doing.id, createdDaysAgo: 30 });
    const soonerDeadline = await addTask({ title: 'Due 3 days ago', dueInDays: -3, topicId: doing.id, createdDaysAgo: 1 });

    const ranked = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked[0].score, ranked[1].score);
    assert.deepEqual(
      ranked.map((r) => r.task.id),
      [soonerDeadline.id, newerDeadline.id],
    );
    assert.equal((await recommend()).task.id, soonerDeadline.id);
  });

  test('same score and same due_at: the task created first wins', async () => {
    const todo = await addTopic({ title: 'Chapter 2', status: 'TODO' });
    const createdLater = await addTask({ title: 'Created today', dueInDays: 2, topicId: todo.id, createdDaysAgo: 0 });
    const createdFirst = await addTask({ title: 'Created a week ago', dueInDays: 2, topicId: todo.id, createdDaysAgo: 7 });

    const ranked = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.equal(ranked[0].score, 6);
    assert.equal(ranked[1].score, 6);
    assert.deepEqual(
      ranked.map((r) => r.task.id),
      [createdFirst.id, createdLater.id],
    );
    assert.equal((await recommend()).task.id, createdFirst.id);
  });

  test('a lower score never beats a higher one, whatever due_at / created_at say', async () => {
    const doing = await addTopic({ title: 'Doing', status: 'DOING', sortOrder: 1 });
    const todo = await addTopic({ title: 'Todo', status: 'TODO', sortOrder: 2 });
    const todoTask = await addTask({ title: 'TODO topic, due sooner', dueInDays: 1, topicId: todo.id, createdDaysAgo: 9 });
    const doingTask = await addTask({ title: 'DOING topic, due later', dueInDays: 2, topicId: doing.id, createdDaysAgo: 0 });

    const ranked = await scoreUserTasks(prisma, user.id, { now: NOW });
    assert.deepEqual(
      ranked.map((r) => [r.task.id, r.score]),
      [
        [doingTask.id, 9], // 4 + 5
        [todoTask.id, 8.667], // 6.667 + 2
      ],
    );
  });
});

describe('Case 5: no open task left', () => {
  // A weekly slot of `courseId` on `dayOfWeek` (ISO, 1 = Monday) at 09:00 Asia/Ho_Chi_Minh.
  const addSlot = (courseId, dayOfWeek) =>
    prisma.schedule.createMany({
      data: [
        {
          courseId,
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

  test('only DONE tasks -> suggests the DOING topic of the course with the nearest class', async () => {
    await addTask({ title: 'Finished', dueInDays: -1, status: 'DONE' });
    await addTask({ title: 'Also finished', dueInDays: 3, status: 'DONE' });
    const physics = await prisma.topic.create({ data: { courseId: bare.id, sortOrder: 1, title: 'Kinematics', status: 'DOING' } });
    await addTopic({ title: 'Chapter 2', status: 'DOING' });
    await addSlot(course.id, 1); // Monday 09:00 already passed today -> next Monday
    await addSlot(bare.id, 3); // Wednesday -> in 2 days

    assert.deepEqual(await scoreUserTasks(prisma, user.id, { now: NOW }), []);

    const answer = await recommend();
    assert.equal(answer.kind, KIND.TOPIC);
    assert.equal(answer.task, null);
    assert.equal(answer.score, null);
    assert.equal(answer.scoreBreakdown, null);
    assert.equal(answer.openTaskCount, 0);
    assert.deepEqual(answer.topic, { id: physics.id, title: 'Kinematics', status: 'DOING' });
    assert.deepEqual(answer.course, { id: bare.id, code: 'PHY100', name: 'Physics' });
    assert.equal(answer.nextClass.startUtc, '2026-11-11T02:00:00.000Z');
    assert.match(answer.reason, /No open task/);
  });

  test('falls back to the first TODO topic when the nearest course has no DOING topic', async () => {
    await addTopic({ title: 'Chapter 1', status: 'DONE', sortOrder: 1 });
    const ch2 = await addTopic({ title: 'Chapter 2', status: 'TODO', sortOrder: 2 });
    await addSlot(course.id, 2);

    const answer = await recommend();
    assert.equal(answer.kind, KIND.TOPIC);
    assert.equal(answer.topic.id, ch2.id);
    assert.match(answer.reason, /first TODO topic of Databases/);
  });

  test('no task, no topic, no timetable -> empty state', async () => {
    const answer = await recommend();
    assert.equal(answer.kind, KIND.EMPTY);
    assert.equal(answer.task, null);
    assert.equal(answer.topic, null);
    assert.equal(answer.course, null);
    assert.equal(answer.nextClass, null);
    assert.equal(answer.score, null);
    assert.equal(answer.scoreBreakdown, null);
    assert.equal(answer.openTaskCount, 0);
    assert.match(answer.reason, /Nothing to do yet/);
  });

  test('a timetable alone (no topic) is still the empty state', async () => {
    await addSlot(course.id, 2);
    assert.equal((await recommend()).kind, KIND.EMPTY);
  });
});
