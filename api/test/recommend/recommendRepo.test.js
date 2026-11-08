// WBS 3.1.1 — scoring a user's tasks from the database: Rule 06 scoping, DONE skipped, topic auto-link.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFakePrisma } = require('../helpers');
const { createTask } = require('../../src/tasks/taskRepo');
const { scoreUserTasks, loadLinkCandidates } = require('../../src/recommend/recommendRepo');

const NOW = new Date('2026-11-09T09:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const inDays = (n) => new Date(NOW.getTime() + n * DAY);

let prisma;
let alice;
let bob;

async function seedUser(email) {
  const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
  // Course with topics: chapter 1 DONE, chapter 2 TODO (+ subtopic 2.1 DOING), chapter 3 DOING.
  const course = await prisma.course.create({ data: { userId: user.id, code: 'CS101', name: 'Programming' } });
  const ch1 = await prisma.topic.create({ data: { courseId: course.id, sortOrder: 1, title: 'Chapter 1', status: 'DONE' } });
  const ch2 = await prisma.topic.create({ data: { courseId: course.id, sortOrder: 2, title: 'Chapter 2', status: 'TODO' } });
  const sub21 = await prisma.topic.create({
    data: { courseId: course.id, parentId: ch2.id, sortOrder: 1, title: '2.1', status: 'DOING' },
  });
  const ch3 = await prisma.topic.create({ data: { courseId: course.id, sortOrder: 3, title: 'Chapter 3', status: 'DOING' } });
  // Course without any topic.
  const bare = await prisma.course.create({ data: { userId: user.id, code: 'PHY100', name: 'Physics' } });
  return { user, course, bare, topics: { ch1, ch2, sub21, ch3 } };
}

beforeEach(async () => {
  prisma = createFakePrisma();
  alice = await seedUser('alice@sfsh.dev');
  bob = await seedUser('bob@sfsh.dev');
});

describe('scoreUserTasks', () => {
  test('scores every open task of the caller and ranks them, highest score first', async () => {
    const uid = alice.user.id;
    const withDoing = await createTask(prisma, uid, {
      title: 'Lab 3',
      dueAt: inDays(2),
      courseId: alice.course.id,
      topicId: alice.topics.ch3.id,
    });
    const unlinked = await createTask(prisma, uid, { title: 'Essay', dueAt: inDays(1), courseId: alice.course.id });
    const noTopics = await createTask(prisma, uid, { title: 'Quiz', dueAt: inDays(-1), courseId: alice.bare.id });
    await createTask(prisma, uid, { title: 'Old', dueAt: inDays(-5), courseId: alice.course.id, status: 'DONE' });

    const ranked = await scoreUserTasks(prisma, uid, { now: NOW });

    assert.deepEqual(
      ranked.map((r) => [r.task.title, r.score]),
      [
        ['Quiz', 23], // overdue, course without topics: 20 + 0 + 3
        ['Lab 3', 9], // 2 days, DOING topic: 4 + 5
        ['Essay', 8.667], // 1 day, auto-linked to chapter 2 (TODO): 6.667 + 2
      ],
    );

    const [quiz, lab, essay] = ranked;
    assert.equal(quiz.task.id, noTopics.id);
    assert.equal(quiz.topic, null);
    assert.equal(quiz.topicAutoLinked, false);
    assert.equal(quiz.isOverdue, true);

    assert.equal(lab.task.id, withDoing.id);
    assert.equal(lab.topic.id, alice.topics.ch3.id);
    assert.equal(lab.topic.status, 'DOING');
    assert.equal(lab.topicAutoLinked, false);

    assert.equal(essay.task.id, unlinked.id);
    assert.equal(essay.topic.id, alice.topics.ch2.id);
    assert.equal(essay.topicAutoLinked, true);
    assert.deepEqual(essay.breakdown, { baseUrgencyScore: 6.667, topicDoingBonus: 2, overdueBonus: 0 });
  });

  test('skips DONE tasks entirely', async () => {
    await createTask(prisma, alice.user.id, { title: 'Old', dueAt: inDays(-5), courseId: alice.course.id, status: 'DONE' });
    assert.deepEqual(await scoreUserTasks(prisma, alice.user.id, { now: NOW }), []);
  });

  test('the auto-link is computed only: topic_id stays null in the database', async () => {
    const t = await createTask(prisma, alice.user.id, { title: 'Essay', dueAt: inDays(1), courseId: alice.course.id });
    await scoreUserTasks(prisma, alice.user.id, { now: NOW });
    assert.equal(prisma.tasks.find((row) => row.id === t.id).topicId, null);
  });

  test('includes the task course and topic rows for the response layer', async () => {
    await createTask(prisma, alice.user.id, { title: 'Essay', dueAt: inDays(1), courseId: alice.course.id });
    const [r] = await scoreUserTasks(prisma, alice.user.id, { now: NOW });
    assert.deepEqual(r.task.course, { id: alice.course.id, code: 'CS101', name: 'Programming' });
    assert.equal(r.task.topic, null);
    assert.equal(r.daysLeft, 1);
  });

  test("never returns another user's tasks (Rule 06)", async () => {
    await createTask(prisma, bob.user.id, { title: 'Bob', dueAt: inDays(-1), courseId: bob.course.id });
    await createTask(prisma, alice.user.id, { title: 'Alice', dueAt: inDays(1), courseId: alice.course.id });

    const ranked = await scoreUserTasks(prisma, alice.user.id, { now: NOW });
    assert.deepEqual(
      ranked.map((r) => r.task.title),
      ['Alice'],
    );
  });

  test('rejects a missing user id', async () => {
    await assert.rejects(scoreUserTasks(prisma, undefined, { now: NOW }), /Rule 06/);
  });
});

describe('loadLinkCandidates', () => {
  test('returns every topic of the given courses (DONE included) grouped by course', async () => {
    const byCourse = await loadLinkCandidates(prisma, alice.user.id, [alice.course.id, alice.bare.id]);
    assert.deepEqual([...byCourse.keys()], [alice.course.id]);
    assert.deepEqual(
      byCourse
        .get(alice.course.id)
        .map((t) => t.title)
        .sort(),
      ['2.1', 'Chapter 1', 'Chapter 2', 'Chapter 3'],
    );
  });

  test('a task without topic is linked to the first open topic in syllabus order, not the smallest raw sort_order', async () => {
    // Chapter 2 is DONE -> its open subtopic 2.1 (DOING) is the next topic in the syllabus.
    await prisma.topic.update({ where: { id: alice.topics.ch2.id }, data: { status: 'DONE' } });
    await createTask(prisma, alice.user.id, { title: 'Essay', dueAt: inDays(1), courseId: alice.course.id });

    const [r] = await scoreUserTasks(prisma, alice.user.id, { now: NOW });
    assert.equal(r.topic.id, alice.topics.sub21.id);
    assert.equal(r.topicAutoLinked, true);
    assert.equal(r.score, 11.667); // 10 / 1.5 + 5
  });

  test("ignores courses of another user and returns nothing for no courses", async () => {
    assert.equal((await loadLinkCandidates(prisma, alice.user.id, [bob.course.id])).size, 0);
    assert.equal((await loadLinkCandidates(prisma, alice.user.id, [])).size, 0);
  });
});
