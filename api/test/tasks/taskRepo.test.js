// WBS 2.4a.1 — multi-tenant rules of the tasks data layer.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFakePrisma } = require('../helpers');
const { listTasks, getTask, createTask, updateTask, deleteTask } = require('../../src/tasks/taskRepo');

let prisma;
let alice;
let bob;

const DAY = 24 * 60 * 60 * 1000;
const inDays = (n) => new Date(Date.now() + n * DAY);

async function seedUser(email) {
  const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
  const course = await prisma.course.create({ data: { userId: user.id, code: 'CS101', name: 'Programming' } });
  const topic = await prisma.topic.create({ data: { courseId: course.id, sortOrder: 1, title: 'Chapter 1' } });
  return { user, course, topic };
}

beforeEach(async () => {
  prisma = createFakePrisma();
  alice = await seedUser('alice@sfsh.dev');
  bob = await seedUser('bob@sfsh.dev');
});

async function expect404(promise, what) {
  await assert.rejects(promise, (err) => {
    assert.equal(err.status, 404);
    assert.equal(err.code, 'NOT_FOUND');
    if (what) assert.match(err.message, new RegExp(what));
    return true;
  });
}

describe('createTask', () => {
  test('stores the task under the caller user_id with the course and topic', async () => {
    const task = await createTask(prisma, alice.user.id, {
      title: 'Lab 1',
      dueAt: inDays(2),
      courseId: alice.course.id,
      topicId: alice.topic.id,
    });

    assert.equal(task.userId, alice.user.id);
    assert.equal(task.status, 'TODO');
    assert.deepEqual(task.course, { id: alice.course.id, code: 'CS101', name: 'Programming' });
    assert.deepEqual(task.topic, { id: alice.topic.id, title: 'Chapter 1' });
  });

  test("rejects another user's course with 404", async () => {
    await expect404(createTask(prisma, alice.user.id, { title: 'x', dueAt: inDays(1), courseId: bob.course.id }), 'Course');
    assert.equal(prisma.tasks.length, 0);
  });

  test('rejects a topic that is not in the given course with 404', async () => {
    await expect404(
      createTask(prisma, alice.user.id, { title: 'x', dueAt: inDays(1), courseId: alice.course.id, topicId: bob.topic.id }),
      'Topic',
    );
  });
});

describe('listTasks / getTask', () => {
  beforeEach(async () => {
    await createTask(prisma, alice.user.id, { title: 'A later', dueAt: inDays(9), courseId: alice.course.id });
    await createTask(prisma, alice.user.id, { title: 'A soon', dueAt: inDays(1), courseId: alice.course.id, status: 'DOING' });
    await createTask(prisma, bob.user.id, { title: 'B', dueAt: inDays(1), courseId: bob.course.id });
  });

  test('returns only the caller tasks, ordered by due_at', async () => {
    const tasks = await listTasks(prisma, alice.user.id);
    assert.deepEqual(
      tasks.map((t) => t.title),
      ['A soon', 'A later'],
    );
    assert.ok(tasks.every((t) => t.userId === alice.user.id));
  });

  test('filters by course_id and status inside the user scope', async () => {
    assert.equal((await listTasks(prisma, alice.user.id, { status: 'DOING' })).length, 1);
    assert.equal((await listTasks(prisma, alice.user.id, { courseId: alice.course.id })).length, 2);
    // Bob's course id never leaks Bob's tasks into Alice's list.
    assert.equal((await listTasks(prisma, alice.user.id, { courseId: bob.course.id })).length, 0);
  });

  test("getTask answers 404 for another user's task", async () => {
    const bobTask = prisma.tasks.find((t) => t.userId === bob.user.id);
    assert.ok(await getTask(prisma, bob.user.id, bobTask.id));
    await expect404(getTask(prisma, alice.user.id, bobTask.id), 'Task');
  });
});

describe('updateTask', () => {
  test('updates own task and re-checks the topic when the course changes', async () => {
    const task = await createTask(prisma, alice.user.id, {
      title: 'x',
      dueAt: inDays(1),
      courseId: alice.course.id,
      topicId: alice.topic.id,
    });
    const other = await prisma.course.create({ data: { userId: alice.user.id, name: 'Math' } });

    const updated = await updateTask(prisma, alice.user.id, task.id, { status: 'DONE', title: 'y' });
    assert.equal(updated.status, 'DONE');
    assert.equal(updated.title, 'y');

    // Chapter 1 belongs to CS101, so moving the task to Math must clear or replace the topic.
    await expect404(updateTask(prisma, alice.user.id, task.id, { courseId: other.id }), 'Topic');
    const moved = await updateTask(prisma, alice.user.id, task.id, { courseId: other.id, topicId: null });
    assert.equal(moved.courseId, other.id);
    assert.equal(moved.topic, null);
  });

  test("cannot update another user's task (404, row untouched)", async () => {
    const task = await createTask(prisma, bob.user.id, { title: 'B', dueAt: inDays(1), courseId: bob.course.id });
    await expect404(updateTask(prisma, alice.user.id, task.id, { title: 'hacked' }), 'Task');
    assert.equal(prisma.tasks[0].title, 'B');
  });

  test("cannot move own task into another user's course", async () => {
    const task = await createTask(prisma, alice.user.id, { title: 'A', dueAt: inDays(1), courseId: alice.course.id });
    await expect404(updateTask(prisma, alice.user.id, task.id, { courseId: bob.course.id }), 'Course');
  });
});

describe('deleteTask', () => {
  test('deletes own task, 404 for another user or an unknown id', async () => {
    const mine = await createTask(prisma, alice.user.id, { title: 'A', dueAt: inDays(1), courseId: alice.course.id });
    const theirs = await createTask(prisma, bob.user.id, { title: 'B', dueAt: inDays(1), courseId: bob.course.id });

    await expect404(deleteTask(prisma, alice.user.id, theirs.id), 'Task');
    await expect404(deleteTask(prisma, alice.user.id, 9999), 'Task');
    assert.equal(prisma.tasks.length, 2);

    await deleteTask(prisma, alice.user.id, mine.id);
    assert.deepEqual(
      prisma.tasks.map((t) => t.id),
      [theirs.id],
    );
  });
});
