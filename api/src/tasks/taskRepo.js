// WBS 2.4a.1 — data access for the `tasks` table.
//
// Multi-tenant rules (Rule 06):
//   - every SELECT / INSERT / UPDATE / DELETE is filtered by the user_id taken
//     from the JWT (`req.userId`), built with byUser() so it cannot be forgotten;
//   - a task, course or topic that belongs to another user is indistinguishable
//     from one that does not exist: the API answers 404 NOT_FOUND, never 403;
//   - course_id must be one of the user's courses, topic_id (optional) must be a
//     topic of that course.
//
// Indexes used: tasks(user_id, due_at) for the list, tasks(due_at) for cron-style
// deadline scans. Both exist since the WBS 1.1 migration.

const { ApiError } = require('../errors');
const { byUser, byCourseOwner } = require('../db/scope');

const TASK_INCLUDE = {
  course: { select: { id: true, code: true, name: true } },
  topic: { select: { id: true, title: true } },
};

const notFound = (what) => new ApiError(404, 'NOT_FOUND', `${what} not found`);

// Prisma raises P2025 when an update/delete matches no row (here: wrong user or wrong id).
const isRecordNotFound = (err) => err?.code === 'P2025';

async function assertCourseOwned(prisma, userId, courseId) {
  const course = await prisma.course.findFirst({ where: byUser(userId, { id: courseId }), select: { id: true } });
  if (!course) throw notFound('Course');
}

async function assertTopicInCourse(prisma, userId, courseId, topicId) {
  if (topicId === null || topicId === undefined) return;
  const topic = await prisma.topic.findFirst({
    where: byCourseOwner(userId, { id: topicId, courseId }),
    select: { id: true },
  });
  if (!topic) throw notFound('Topic');
}

// GET list, newest deadline last. Filters are optional.
async function listTasks(prisma, userId, { courseId, status } = {}) {
  const where = {};
  if (courseId !== undefined) where.courseId = courseId;
  if (status !== undefined) where.status = status;

  return prisma.task.findMany({
    where: byUser(userId, where),
    include: TASK_INCLUDE,
    orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
  });
}

async function getTask(prisma, userId, id) {
  const task = await prisma.task.findFirst({ where: byUser(userId, { id }), include: TASK_INCLUDE });
  if (!task) throw notFound('Task');
  return task;
}

// input: { title, dueAt: Date, courseId, topicId?, status? }
async function createTask(prisma, userId, input) {
  await assertCourseOwned(prisma, userId, input.courseId);
  await assertTopicInCourse(prisma, userId, input.courseId, input.topicId);

  return prisma.task.create({
    data: {
      userId,
      courseId: input.courseId,
      topicId: input.topicId ?? null,
      title: input.title,
      dueAt: input.dueAt,
      status: input.status ?? 'TODO',
    },
    include: TASK_INCLUDE,
  });
}

// patch: any subset of { title, dueAt, courseId, topicId, status }.
// When the course changes, the (existing or new) topic must belong to the new course.
async function updateTask(prisma, userId, id, patch) {
  const current = await getTask(prisma, userId, id);

  const courseId = patch.courseId ?? current.courseId;
  const topicId = patch.topicId === undefined ? current.topicId : patch.topicId;

  if (patch.courseId !== undefined && patch.courseId !== current.courseId) {
    await assertCourseOwned(prisma, userId, courseId);
  }
  if (topicId !== null && (topicId !== current.topicId || courseId !== current.courseId)) {
    await assertTopicInCourse(prisma, userId, courseId, topicId);
  }

  const data = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.dueAt !== undefined) data.dueAt = patch.dueAt;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.courseId !== undefined) data.courseId = courseId;
  if (patch.topicId !== undefined) data.topicId = topicId;

  try {
    return await prisma.task.update({ where: byUser(userId, { id }), data, include: TASK_INCLUDE });
  } catch (err) {
    if (isRecordNotFound(err)) throw notFound('Task');
    throw err;
  }
}

async function deleteTask(prisma, userId, id) {
  try {
    return await prisma.task.delete({ where: byUser(userId, { id }) });
  } catch (err) {
    if (isRecordNotFound(err)) throw notFound('Task');
    throw err;
  }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, TASK_INCLUDE };
