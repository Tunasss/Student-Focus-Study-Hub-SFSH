// WBS 2.2.4 — data access for the `topics` table.
//
// Rule 06: topics have no user_id; they are scoped through their course (byCourseOwner). A course or topic that
// belongs to another user answers 404 NOT_FOUND. JSON field `sortOrder` <-> column `sort_order`.

const { ApiError } = require('../errors');
const { byUser, byCourseOwner } = require('../db/scope');
const { extractChapterNumber } = require('../syllabus/chapterOrder');

const notFound = (what) => new ApiError(404, 'NOT_FOUND', `${what} not found`);
const isRecordNotFound = (err) => err?.code === 'P2025';
const isUniqueViolation = (err) => err?.code === 'P2002';

function serializeTopic(topic) {
  return {
    id: topic.id,
    courseId: topic.courseId,
    parentId: topic.parentId ?? null,
    sortOrder: topic.sortOrder,
    title: topic.title,
    description: topic.description ?? null,
    sourceFile: topic.sourceFile ?? null,
    status: topic.status,
  };
}

async function assertCourseOwned(prisma, userId, courseId) {
  const course = await prisma.course.findFirst({ where: byUser(userId, { id: courseId }), select: { id: true } });
  if (!course) throw notFound('Course');
}

async function listTopics(prisma, userId, courseId) {
  await assertCourseOwned(prisma, userId, courseId);
  return prisma.topic.findMany({
    where: byCourseOwner(userId, { courseId }),
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
  });
}

async function nextSortOrder(prisma, userId, courseId, parentId = null) {
  const last = await prisma.topic.findFirst({
    where: byCourseOwner(userId, { courseId, parentId }),
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? 0) + 1;
}

// input: { title, description, status, sortOrder?, parentId?, sourceFile? }
async function createTopic(prisma, userId, courseId, input) {
  await assertCourseOwned(prisma, userId, courseId);
  const parentId = input.parentId ?? null;
  const sortOrder = input.sortOrder ?? (await nextSortOrder(prisma, userId, courseId, parentId));

  try {
    return await prisma.topic.create({
      data: {
        courseId,
        parentId,
        sortOrder,
        title: input.title,
        description: input.description ?? null,
        sourceFile: input.sourceFile ?? null,
        status: input.status ?? 'TODO',
      },
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
      sourceFile: item.sourceFile ?? null,
      parentId: item.parentId ?? null,
      status: item.status,
    }));
}

// Persists topics hierarchically (chapters + subtopics) or flat.
// Supports `mode: 'append'` (keeps existing topics, appends after max sortOrder)
// and `mode: 'replace'` (replaces existing topics).
async function saveHierarchicalTopics(prisma, userId, courseId, payload) {
  await assertCourseOwned(prisma, userId, courseId);

  const items = Array.isArray(payload) ? payload : (payload.topics || payload.chapters || []);
  const isChapters = !Array.isArray(payload) && Array.isArray(payload.chapters) && payload.chapters.length > 0;
  const mode = payload.mode ?? (isChapters ? 'append' : 'replace');

  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.topic.findMany({ where: byCourseOwner(userId, { courseId }) });
      const statusByTitle = new Map(existing.map((t) => [t.title.trim().toLowerCase(), t.status]));
      let replacedCount = 0;

      if (mode === 'replace') {
        replacedCount = existing.length;
        await tx.topic.deleteMany({ where: byCourseOwner(userId, { courseId }) });
      }

      if (isChapters) {
        const existingChapters = mode === 'append' ? existing.filter((t) => t.parentId === null) : [];
        const takenOrders = new Set(existingChapters.map((ch) => ch.sortOrder));
        let maxOrder = existingChapters.reduce((max, ch) => Math.max(max, ch.sortOrder), 0);

        // Sort incoming chapters naturally before inserting so Chapter 4 is handled before Chapter 5 if both present
        const sortedIncoming = [...payload.chapters].sort((a, b) => {
          const numA = extractChapterNumber(a.title) ?? extractChapterNumber(a.sourceFile ?? a.source_file);
          const numB = extractChapterNumber(b.title) ?? extractChapterNumber(b.sourceFile ?? b.source_file);
          if (numA !== null && numB !== null) return numA - numB;
          if (numA !== null) return -1;
          if (numB !== null) return 1;
          return (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0);
        });

        for (let i = 0; i < sortedIncoming.length; i++) {
          const ch = sortedIncoming[i];
          const naturalNum = extractChapterNumber(ch.title) ?? extractChapterNumber(ch.sourceFile ?? ch.source_file);

          let targetOrder;
          if (naturalNum && Number.isInteger(naturalNum) && naturalNum > 0 && !takenOrders.has(naturalNum)) {
            targetOrder = naturalNum;
          } else if (ch.sortOrder && Number.isInteger(ch.sortOrder) && ch.sortOrder > 0 && !takenOrders.has(ch.sortOrder)) {
            targetOrder = ch.sortOrder;
          } else if (ch.order && Number.isInteger(ch.order) && ch.order > 0 && !takenOrders.has(ch.order)) {
            targetOrder = ch.order;
          } else {
            maxOrder += 1;
            while (takenOrders.has(maxOrder)) {
              maxOrder += 1;
            }
            targetOrder = maxOrder;
          }
          takenOrders.add(targetOrder);

          const createdChapter = await tx.topic.create({
            data: {
              courseId,
              parentId: null,
              sortOrder: targetOrder,
              title: ch.title,
              description: ch.description ?? null,
              sourceFile: ch.sourceFile ?? null,
              status: ch.status ?? statusByTitle.get(ch.title.trim().toLowerCase()) ?? 'TODO',
            },
          });

          if (Array.isArray(ch.subtopics) && ch.subtopics.length > 0) {
            await tx.topic.createMany({
              data: ch.subtopics.map((sub, j) => ({
                courseId,
                parentId: createdChapter.id,
                sortOrder: j + 1,
                title: sub.title,
                description: sub.description ?? null,
                sourceFile: ch.sourceFile ?? null,
                status: sub.status ?? statusByTitle.get(sub.title.trim().toLowerCase()) ?? 'TODO',
              })),
            });
          }
        }
      } else {
        const rows = normalizeBulkTopics(items);
        const existingTop = mode === 'append' ? existing.filter((t) => t.parentId === null) : [];
        let baseOrder = existingTop.reduce((max, ch) => Math.max(max, ch.sortOrder), 0);

        if (rows.length > 0) {
          await tx.topic.createMany({
            data: rows.map((row) => {
              baseOrder += 1;
              return {
                courseId,
                parentId: row.parentId ?? null,
                sortOrder: mode === 'append' ? baseOrder : row.sortOrder,
                title: row.title,
                description: row.description,
                sourceFile: row.sourceFile ?? null,
                status: row.status ?? statusByTitle.get(row.title.trim().toLowerCase()) ?? 'TODO',
              };
            }),
          });
        }
      }

      const topics = await tx.topic.findMany({
        where: byCourseOwner(userId, { courseId }),
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      });

      return { topics, replaced: replacedCount };
    },
    { maxWait: 10000, timeout: 30000 },
  );
}

// Replaces the course's topic list with the confirmed one, in one transaction.
async function replaceTopics(prisma, userId, courseId, items) {
  return saveHierarchicalTopics(prisma, userId, courseId, { mode: 'replace', topics: items });
}

// patch: any subset of { title, description, status, sourceFile }
async function updateTopic(prisma, userId, id, patch) {
  const data = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.sourceFile !== undefined) data.sourceFile = patch.sourceFile;

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
  saveHierarchicalTopics,
  normalizeBulkTopics,
  updateTopic,
  deleteTopic,
};
