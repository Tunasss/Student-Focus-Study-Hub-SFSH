// WBS 2.2.4 — data access for the `topics` table.
//
// Rule 06: topics have no user_id; they are scoped through their course (byCourseOwner). A course or topic that
// belongs to another user answers 404 NOT_FOUND. JSON field `sortOrder` <-> column `sort_order`
// (unique per course: @@unique([courseId, sortOrder])).

const { ApiError } = require('../errors');
const { byUser, byCourseOwner } = require('../db/scope');

const notFound = (what) => new ApiError(404, 'NOT_FOUND', `${what} not found`);
const isRecordNotFound = (err) => err?.code === 'P2025';
const isUniqueViolation = (err) => err?.code === 'P2002';

function serializeTopic(topic) {
  return {
    id: topic.id,
    courseId: topic.courseId,
    sortOrder: topic.sortOrder,
    title: topic.title,
    description: topic.description ?? null,
    status: topic.status,
  };
}

async function assertCourseOwned(prisma, userId, courseId) {
  const course = await prisma.course.findFirst({ where: byUser(userId, { id: courseId }), select: { id: true } });
  if (!course) throw notFound('Course');
}

async function listTopics(prisma, userId, courseId) {
  await assertCourseOwned(prisma, userId, courseId);
  return prisma.topic.findMany({ where: byCourseOwner(userId, { courseId }), orderBy: { sortOrder: 'asc' } });
}

async function nextSortOrder(prisma, userId, courseId) {
  const last = await prisma.topic.findFirst({
    where: byCourseOwner(userId, { courseId }),
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? 0) + 1;
}

// input: { title, description, status, sortOrder? }
async function createTopic(prisma, userId, courseId, input) {
  await assertCourseOwned(prisma, userId, courseId);
  const sortOrder = input.sortOrder ?? (await nextSortOrder(prisma, userId, courseId));

  try {
    return await prisma.topic.create({
      data: { courseId, sortOrder, title: input.title, description: input.description ?? null, status: input.status ?? 'TODO' },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ApiError(409, 'SORT_ORDER_TAKEN', `This course already has a topic at position ${sortOrder}`);
    }
    throw err;
  }
}

// Orders the confirmed list by its `order` / `sortOrder` (array position when absent) and renumbers 1..n,
// so sort_order is unique and gap-free whatever the preview said.
function normalizeBulkTopics(items) {
  return items
    .map((item, index) => ({ ...item, position: item.sortOrder ?? item.order ?? index + 1, index }))
    .sort((a, b) => a.position - b.position || a.index - b.index)
    .map((item, i) => ({
      sortOrder: i + 1,
      title: item.title,
      description: item.description ?? null,
      status: item.status,
    }));
}

// Replaces the course's topic list with the confirmed one, in one transaction.
// Learning status is carried over from an existing topic with the same title (case-insensitive) unless the
// item sets its own status. Tasks and sessions linked to removed topics keep running with topic_id = null.
async function replaceTopics(prisma, userId, courseId, items) {
  await assertCourseOwned(prisma, userId, courseId);
  const rows = normalizeBulkTopics(items);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.topic.findMany({ where: byCourseOwner(userId, { courseId }) });
    const statusByTitle = new Map(existing.map((t) => [t.title.trim().toLowerCase(), t.status]));

    await tx.topic.deleteMany({ where: byCourseOwner(userId, { courseId }) });
    await tx.topic.createMany({
      data: rows.map((row) => ({
        courseId,
        sortOrder: row.sortOrder,
        title: row.title,
        description: row.description,
        status: row.status ?? statusByTitle.get(row.title.toLowerCase()) ?? 'TODO',
      })),
    });

    const topics = await tx.topic.findMany({ where: byCourseOwner(userId, { courseId }), orderBy: { sortOrder: 'asc' } });
    return { topics, replaced: existing.length };
  });
}

// patch: any subset of { title, description, status }
async function updateTopic(prisma, userId, id, patch) {
  const data = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.status !== undefined) data.status = patch.status;

  try {
    return await prisma.topic.update({ where: byCourseOwner(userId, { id }), data });
  } catch (err) {
    if (isRecordNotFound(err)) throw notFound('Topic');
    throw err;
  }
}

async function deleteTopic(prisma, userId, id) {
  try {
    return await prisma.topic.delete({ where: byCourseOwner(userId, { id }) });
  } catch (err) {
    if (isRecordNotFound(err)) throw notFound('Topic');
    throw err;
  }
}

module.exports = {
  serializeTopic,
  listTopics,
  createTopic,
  replaceTopics,
  normalizeBulkTopics,
  updateTopic,
  deleteTopic,
};
