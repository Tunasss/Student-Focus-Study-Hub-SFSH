// WBS 2.2.4 — topics data layer: Rule 06 scoping through the course, bulk replace, sort_order mapping.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFakePrisma } = require('../helpers');
const {
  listTopics,
  createTopic,
  replaceTopics,
  normalizeBulkTopics,
  updateTopic,
  deleteTopic,
  serializeTopic,
} = require('../../src/topics/topicRepo');

let prisma;
let alice;
let bob;

async function seedUser(email) {
  const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
  const course = await prisma.course.create({ data: { userId: user.id, code: 'CS101', name: 'Programming' } });
  return { user, course };
}

beforeEach(async () => {
  prisma = createFakePrisma();
  alice = await seedUser('alice@sfsh.dev');
  bob = await seedUser('bob@sfsh.dev');
});

function expect404(promise, what) {
  return assert.rejects(promise, (err) => {
    assert.equal(err.status, 404);
    assert.equal(err.code, 'NOT_FOUND');
    if (what) assert.match(err.message, new RegExp(what));
    return true;
  });
}

describe('createTopic / listTopics', () => {
  test('appends at the next sort_order and lists in order', async () => {
    const a = await createTopic(prisma, alice.user.id, alice.course.id, { title: 'Intro' });
    const b = await createTopic(prisma, alice.user.id, alice.course.id, { title: 'Loops', description: 'for/while' });
    assert.equal(a.sortOrder, 1);
    assert.equal(b.sortOrder, 2);
    assert.equal(a.status, 'TODO');

    const topics = await listTopics(prisma, alice.user.id, alice.course.id);
    assert.deepEqual(
      topics.map((t) => [t.sortOrder, t.title]),
      [
        [1, 'Intro'],
        [2, 'Loops'],
      ],
    );
  });

  test('an explicit sortOrder is kept; a taken one answers 409 SORT_ORDER_TAKEN', async () => {
    await createTopic(prisma, alice.user.id, alice.course.id, { title: 'Five', sortOrder: 5 });
    await assert.rejects(createTopic(prisma, alice.user.id, alice.course.id, { title: 'Dup', sortOrder: 5 }), {
      status: 409,
      code: 'SORT_ORDER_TAKEN',
    });
    const next = await createTopic(prisma, alice.user.id, alice.course.id, { title: 'Six' });
    assert.equal(next.sortOrder, 6);
  });

  test("another user's course answers 404 for list and create", async () => {
    await expect404(listTopics(prisma, alice.user.id, bob.course.id), 'Course');
    await expect404(createTopic(prisma, alice.user.id, bob.course.id, { title: 'x' }), 'Course');
    assert.equal(prisma.topics.length, 0);
  });
});

describe('normalizeBulkTopics (order -> sort_order)', () => {
  test('sorts by order / sortOrder, falls back to array position, renumbers 1..n', () => {
    const rows = normalizeBulkTopics([
      { title: 'C', order: 30 },
      { title: 'A', order: 10 },
      { title: 'B', sortOrder: 20 },
      { title: 'D' }, // no position: array index 4
    ]);
    assert.deepEqual(
      rows.map((r) => [r.sortOrder, r.title]),
      [
        [1, 'D'],
        [2, 'A'],
        [3, 'B'],
        [4, 'C'],
      ],
    );
  });

  test('keeps the given order for ties', () => {
    const rows = normalizeBulkTopics([
      { title: 'X', order: 1 },
      { title: 'Y', order: 1 },
    ]);
    assert.deepEqual(
      rows.map((r) => r.title),
      ['X', 'Y'],
    );
  });
});

describe('replaceTopics (bulk save of the confirmed preview)', () => {
  test('writes the whole list for the right course and returns it ordered', async () => {
    const { topics, replaced } = await replaceTopics(prisma, alice.user.id, alice.course.id, [
      { title: 'Chapter 2', order: 2, description: 'second' },
      { title: 'Chapter 1', order: 1 },
    ]);

    assert.equal(replaced, 0);
    assert.deepEqual(
      topics.map((t) => [t.courseId, t.sortOrder, t.title, t.description, t.status]),
      [
        [alice.course.id, 1, 'Chapter 1', null, 'TODO'],
        [alice.course.id, 2, 'Chapter 2', 'second', 'TODO'],
      ],
    );
  });

  test('replaces existing topics, carrying learning status over by title', async () => {
    const old = await replaceTopics(prisma, alice.user.id, alice.course.id, [
      { title: 'Intro', order: 1 },
      { title: 'Old chapter', order: 2 },
    ]);
    await updateTopic(prisma, alice.user.id, old.topics[0].id, { status: 'DONE' });

    const { topics, replaced } = await replaceTopics(prisma, alice.user.id, alice.course.id, [
      { title: 'intro', order: 1 }, // same title, different case -> keeps DONE
      { title: 'New chapter', order: 2, status: 'DOING' },
      { title: 'Another', order: 3 },
    ]);

    assert.equal(replaced, 2);
    assert.deepEqual(
      topics.map((t) => [t.title, t.status]),
      [
        ['intro', 'DONE'],
        ['New chapter', 'DOING'],
        ['Another', 'TODO'],
      ],
    );
    assert.equal(prisma.topics.filter((t) => t.courseId === alice.course.id).length, 3);
  });

  test("does not touch other courses or another user's course", async () => {
    await replaceTopics(prisma, bob.user.id, bob.course.id, [{ title: 'Bob 1', order: 1 }]);
    await expect404(replaceTopics(prisma, alice.user.id, bob.course.id, [{ title: 'hack', order: 1 }]), 'Course');
    const bobTopics = await listTopics(prisma, bob.user.id, bob.course.id);
    assert.deepEqual(
      bobTopics.map((t) => t.title),
      ['Bob 1'],
    );
  });
});

describe('updateTopic / deleteTopic', () => {
  test('updates status, title and description of an own topic', async () => {
    const topic = await createTopic(prisma, alice.user.id, alice.course.id, { title: 'Intro' });
    const updated = await updateTopic(prisma, alice.user.id, topic.id, { status: 'DOING', title: 'Intro (v2)', description: 'd' });
    assert.equal(updated.status, 'DOING');
    assert.equal(updated.title, 'Intro (v2)');
    assert.equal(updated.description, 'd');
    assert.equal(updated.sortOrder, 1);
  });

  test("another user's topic answers 404 and is left untouched", async () => {
    const topic = await createTopic(prisma, bob.user.id, bob.course.id, { title: 'Bob' });
    await expect404(updateTopic(prisma, alice.user.id, topic.id, { status: 'DONE' }), 'Topic');
    await expect404(deleteTopic(prisma, alice.user.id, topic.id), 'Topic');
    assert.equal(prisma.topics[0].status, 'TODO');
    assert.equal(prisma.topics.length, 1);
  });

  test('deletes an own topic; unknown id answers 404', async () => {
    const topic = await createTopic(prisma, alice.user.id, alice.course.id, { title: 'Intro' });
    await deleteTopic(prisma, alice.user.id, topic.id);
    assert.equal(prisma.topics.length, 0);
    await expect404(deleteTopic(prisma, alice.user.id, topic.id), 'Topic');
  });
});

test('serializeTopic exposes sortOrder (not sort_order), parentId, sourceFile and null description', () => {
  assert.deepEqual(serializeTopic({ id: 1, courseId: 2, sortOrder: 3, title: 'T', description: undefined, status: 'TODO' }), {
    id: 1,
    courseId: 2,
    parentId: null,
    sortOrder: 3,
    title: 'T',
    description: null,
    sourceFile: null,
    status: 'TODO',
  });
});
