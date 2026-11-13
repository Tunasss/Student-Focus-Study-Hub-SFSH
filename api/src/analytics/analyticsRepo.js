// WBS 3.4.1 / 4.1.1 — data access for study analytics.
//
// Multi-tenant rules (Rule 06): every query below is built with byUser() / byCourseOwner(),
// so it is filtered by the user_id from the JWT. Nothing here takes a course or user id from the
// request, so one user's numbers can never include another user's rows.
//
// Per-course numbers are summed and counted by MySQL (GROUP BY course_id[, status]); totals use COUNT.
// Only the daily series and the streak load rows (their timestamps), because a calendar day depends
// on the client's timezone: grouping by DATE(started_at) in SQL would bucket by UTC day.
// Indexes: sessions(user_id, started_at), tasks(user_id, completed_at), tasks(user_id, due_at).

const { byUser, byCourseOwner } = require('../db/scope');
const { localDate, startOfLocalDay, addDays } = require('./dates');
const {
  totalMinutes,
  minutesByCourse,
  statusCountsByCourse,
  courseBreakdown,
  currentStreak,
  studyDatesOf,
  dailySeries,
} = require('./metrics');

const RANGE_DAYS = Object.freeze({ '7d': 7, '30d': 30, all: null });

// Local midnight (tz) of the first of the `days` local days ending today.
const daysStart = (days, today, tz) => startOfLocalDay(addDays(today, -(days - 1)), tz);

// Start of a range ('7d' | '30d' | 'all'), or null for all time.
function rangeStart(range, today, tz) {
  const days = RANGE_DAYS[range];
  return days ? daysStart(days, today, tz) : null;
}

function completedSessionsWhere(userId, from) {
  const where = { status: 'COMPLETED' };
  if (from) where.startedAt = { gte: from };
  return byUser(userId, where);
}

function completedTasksWhere(userId, from) {
  const where = { status: 'DONE' };
  if (from) where.completedAt = { gte: from };
  return byUser(userId, where);
}

// SELECT course_id, SUM(minutes) FROM sessions WHERE user_id = ? AND status = 'COMPLETED' [AND started_at >= ?]
// GROUP BY course_id. One group has course_id NULL (free focus).
const focusByCourse = (prisma, userId, from) =>
  prisma.studySession.groupBy({ by: ['courseId'], where: completedSessionsWhere(userId, from), _sum: { minutes: true } });

// SELECT course_id, status, COUNT(*) ... GROUP BY course_id, status
const taskStatusByCourse = (prisma, userId) =>
  prisma.task.groupBy({ by: ['courseId', 'status'], where: byUser(userId), _count: { _all: true } });

// Topics have no user_id: scoped through their course (JOIN courses ON courses.user_id = ?).
const topicStatusByCourse = (prisma, userId) =>
  prisma.topic.groupBy({ by: ['courseId', 'status'], where: byCourseOwner(userId), _count: { _all: true } });

// GET /api/analytics/overview
async function overview(prisma, userId, { range = '7d', tz, now = new Date() }) {
  const today = localDate(now, tz);
  const from = rangeStart(range, today, tz);

  const [courses, focusGroups, studyDays, completedTasksCount, overdueTasksCount, taskGroups, topicGroups] =
    await Promise.all([
      prisma.course.findMany({ where: byUser(userId), select: { id: true, code: true, name: true } }),
      focusByCourse(prisma, userId, from),
      // The streak looks at every study day, whatever the range.
      prisma.studySession.findMany({ where: completedSessionsWhere(userId, null), select: { startedAt: true } }),
      prisma.task.count({ where: completedTasksWhere(userId, from) }),
      // Open work that is past due right now (not limited to the range).
      prisma.task.count({
        where: byUser(userId, { status: { not: 'DONE' }, OR: [{ status: 'OVERDUE' }, { dueAt: { lt: now } }] }),
      }),
      taskStatusByCourse(prisma, userId),
      topicStatusByCourse(prisma, userId),
    ]);

  return {
    range,
    tz,
    from: from ? localDate(from, tz) : null,
    to: today,
    totalFocusMinutes: totalMinutes(focusGroups),
    completedTasksCount,
    overdueTasksCount,
    currentStreakDays: currentStreak(studyDatesOf(studyDays, tz), today),
    courseBreakdown: courseBreakdown(courses, {
      minutes: minutesByCourse(focusGroups),
      topicCounts: statusCountsByCourse(topicGroups),
      taskCounts: statusCountsByCourse(taskGroups),
    }),
  };
}

// Zero-filled [{ date, focusMinutes, tasksCompleted }] for the `days` local days ending today, oldest first.
// Shared by GET /api/analytics/chart-activity and GET /api/analytics/daily-activity.
async function activitySeries(prisma, userId, { days = 7, tz, now = new Date() }) {
  const today = localDate(now, tz);
  const from = daysStart(days, today, tz);

  const [sessions, completedTasks] = await Promise.all([
    prisma.studySession.findMany({ where: completedSessionsWhere(userId, from), select: { minutes: true, startedAt: true } }),
    prisma.task.findMany({ where: completedTasksWhere(userId, from), select: { completedAt: true } }),
  ]);

  return dailySeries({ sessions, completedTasks, today, days, tz });
}

// GET /api/analytics/daily-activity (WBS 3.4.2): the series plus the range it covers.
async function dailyActivity(prisma, userId, { range = '7d', tz, now = new Date() }) {
  return { range, tz, days: await activitySeries(prisma, userId, { days: RANGE_DAYS[range], tz, now }) };
}

module.exports = { RANGE_DAYS, rangeStart, overview, activitySeries, dailyActivity };
