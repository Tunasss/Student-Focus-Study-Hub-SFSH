// WBS 3.4 — data access for the `sessions` table (Pomodoro / focus blocks).
//
// Multi-tenant rules (Rule 06): rows are written with the JWT user's id and read through byUser().
// A course, topic or task of another user is reported as 404 NOT_FOUND, like the tasks API.
//
// Links are optional (free focus has none). Missing links are filled in from the more specific one:
// a task gives its course and topic, a topic gives its course. Links that disagree
// (e.g. a task of another course) are rejected with 400 VALIDATION_ERROR.

const { ApiError } = require('../errors');
const { byUser, byCourseOwner } = require('../db/scope');

// Clocks of phones and laptops drift; a session may not start more than this far in the future.
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

const notFound = (what) => new ApiError(404, 'NOT_FOUND', `${what} not found`);
const invalid = (message) => new ApiError(400, 'VALIDATION_ERROR', message);

async function findOwned(model, where, what) {
  const row = await model.findFirst({ where, select: { id: true, courseId: true, ...(what === 'Task' ? { topicId: true } : {}) } });
  if (!row) throw notFound(what);
  return row;
}

// Resolves { courseId, topicId, taskId } for a new session, checking ownership and consistency.
async function resolveLinks(prisma, userId, input) {
  const task = input.taskId ? await findOwned(prisma.task, byUser(userId, { id: input.taskId }), 'Task') : null;
  const topic = input.topicId
    ? await findOwned(prisma.topic, byCourseOwner(userId, { id: input.topicId }), 'Topic')
    : null;
  if (input.courseId) await findOwned(prisma.course, byUser(userId, { id: input.courseId }), 'Course');

  const courseId = input.courseId ?? task?.courseId ?? topic?.courseId ?? null;
  if (task && task.courseId !== courseId) throw invalid('taskId: the task belongs to another course');
  if (topic && topic.courseId !== courseId) throw invalid('topicId: the topic belongs to another course');

  return { courseId, topicId: topic?.id ?? task?.topicId ?? null, taskId: task?.id ?? null };
}

// input: { startedAt: Date, minutes, status, courseId?, topicId?, taskId? }
async function createSession(prisma, userId, input, now = new Date()) {
  if (input.startedAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    throw invalid('startedAt: must not be in the future');
  }
  const links = await resolveLinks(prisma, userId, input);
  return prisma.studySession.create({
    data: { userId, ...links, startedAt: input.startedAt, minutes: input.minutes, status: input.status },
  });
}

// Newest first. from (inclusive) / to (exclusive) filter on startedAt.
async function listSessions(prisma, userId, { from, to, courseId, status, limit }) {
  const where = {};
  if (from || to) where.startedAt = { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) };
  if (courseId !== undefined) where.courseId = courseId;
  if (status !== undefined) where.status = status;
  return prisma.studySession.findMany({
    where: byUser(userId, where),
    orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    take: limit,
  });
}

// JSON shape of a session. The owner column is never returned.
function serializeSession(s) {
  return {
    id: s.id,
    startedAt: s.startedAt,
    minutes: s.minutes,
    status: s.status,
    courseId: s.courseId ?? null,
    topicId: s.topicId ?? null,
    taskId: s.taskId ?? null,
  };
}

module.exports = { FUTURE_TOLERANCE_MS, createSession, listSessions, serializeSession };
