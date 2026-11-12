// WBS 3.4.1 — data access for study analytics.
//
// Multi-tenant rules (Rule 06): every query below is built with byUser() / byCourseOwner(),
// so it is filtered by the user_id from the JWT. Nothing here takes a course or user id from the
// request, so one user's numbers can never include another user's rows.
//
// Only the columns the math needs are selected, and sums are done in metrics.js. That keeps the
// code testable with the in-memory fake, and a student's history (hundreds of sessions) is small.
// Indexes: sessions(user_id, started_at), tasks(user_id, completed_at), tasks(user_id, due_at).

const { byUser, byCourseOwner } = require('../db/scope');
const { localDate, startOfLocalDay, addDays } = require('./dates');
const { sumMinutes, courseBreakdown, currentStreak, studyDatesOf, dailySeries } = require('./metrics');

const RANGE_DAYS = Object.freeze({ '7d': 7, '30d': 30, all: null });

// Start of the range: local midnight (tz) of the first of the last N days, or null for all time.
function rangeStart(range, today, tz) {
  const days = RANGE_DAYS[range];
  return days ? startOfLocalDay(addDays(today, -(days - 1)), tz) : null;
}

const sinceFilter = (from) => (from ? { gte: from } : undefined);

function completedSessions(prisma, userId, from, select) {
  const where = { status: 'COMPLETED' };
  if (from) where.startedAt = sinceFilter(from);
  return prisma.studySession.findMany({ where: byUser(userId, where), select });
}

function completedTasks(prisma, userId, from) {
  const where = { status: 'DONE' };
  if (from) where.completedAt = sinceFilter(from);
  return prisma.task.findMany({ where: byUser(userId, where), select: { id: true, completedAt: true } });
}

// GET /api/analytics/overview
async function overview(prisma, userId, { range = '7d', tz, now = new Date() }) {
  const today = localDate(now, tz);
  const from = rangeStart(range, today, tz);

  const [courses, sessionsInRange, allSessionDays, doneTasks, overdueTasks, topics, tasks] = await Promise.all([
    prisma.course.findMany({ where: byUser(userId), select: { id: true, code: true, name: true } }),
    completedSessions(prisma, userId, from, { courseId: true, minutes: true, startedAt: true }),
    // The streak looks at every study day, whatever the range.
    completedSessions(prisma, userId, null, { startedAt: true }),
    completedTasks(prisma, userId, from),
    // Open work that is past due right now (not limited to the range).
    prisma.task.findMany({
      where: byUser(userId, { status: { not: 'DONE' }, OR: [{ status: 'OVERDUE' }, { dueAt: { lt: now } }] }),
      select: { id: true },
    }),
    prisma.topic.findMany({ where: byCourseOwner(userId), select: { courseId: true, status: true } }),
    prisma.task.findMany({ where: byUser(userId), select: { courseId: true, status: true } }),
  ]);

  return {
    range,
    tz,
    from: from ? localDate(from, tz) : null,
    to: today,
    totalFocusMinutes: sumMinutes(sessionsInRange),
    completedTasksCount: doneTasks.length,
    overdueTasksCount: overdueTasks.length,
    currentStreakDays: currentStreak(studyDatesOf(allSessionDays, tz), today),
    courseBreakdown: courseBreakdown(courses, { sessions: sessionsInRange, topics, tasks }),
  };
}

// GET /api/analytics/daily-activity
async function dailyActivity(prisma, userId, { range = '7d', tz, now = new Date() }) {
  const days = RANGE_DAYS[range];
  const today = localDate(now, tz);
  const from = rangeStart(range, today, tz);

  const [sessions, doneTasks] = await Promise.all([
    completedSessions(prisma, userId, from, { minutes: true, startedAt: true }),
    completedTasks(prisma, userId, from),
  ]);

  return {
    range,
    tz,
    days: dailySeries({ sessions, completedTasks: doneTasks, today, days, tz }),
  };
}

module.exports = { RANGE_DAYS, rangeStart, overview, dailyActivity };
