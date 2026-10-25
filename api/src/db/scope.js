// Rule 06: every query must be filtered by user_id.
// Use these builders for `where` clauses instead of hand-writing filters, so a
// missing user scope is impossible to forget.
//
//   prisma.task.findMany({ where: byUser(userId, { status: 'TODO' }) })
//   prisma.topic.findMany({ where: byCourseOwner(userId, { courseId }) })

function assertUserId(userId) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Rule 06 violation: a valid userId is required for every query');
  }
}

// For tables with a direct user_id column: courses, tasks, sessions.
function byUser(userId, where = {}) {
  assertUserId(userId);
  return { ...where, userId };
}

// For tables scoped through their course: schedules, topics.
function byCourseOwner(userId, where = {}) {
  assertUserId(userId);
  return { ...where, course: { ...(where.course ?? {}), userId } };
}

module.exports = { byUser, byCourseOwner, assertUserId };
