// WBS 3.4.1 / 4.1.1 — pure aggregation math for study analytics (no I/O, easy to unit test).
//
// Inputs are rows and GROUP BY results already scoped to one user by analyticsRepo.js (Rule 06).

const { localDate, addDays, lastNDays } = require('./dates');

// progress_pct = floor(completed / total * 100), 0 when there is nothing to complete.
// Integer arithmetic (completed * 100 first) avoids float artefacts such as 29 / 100 * 100 = 28.999…
function progressPct(completed, total) {
  if (!Number.isInteger(total) || total <= 0) return 0;
  return Math.floor((completed * 100) / total);
}

// Total minutes over focus groups (see minutesByCourse), including the group without a course.
const totalMinutes = (groups) => groups.reduce((sum, g) => sum + (g._sum?.minutes ?? 0), 0);

// Rows of studySession.groupBy({ by: ['courseId'], _sum: { minutes } }) -> Map courseId -> minutes.
// The group with courseId null (free focus) is skipped: it counts towards the user's total only.
function minutesByCourse(groups) {
  const byCourse = new Map();
  for (const g of groups) {
    if (g.courseId === null || g.courseId === undefined) continue;
    byCourse.set(g.courseId, (byCourse.get(g.courseId) ?? 0) + (g._sum?.minutes ?? 0));
  }
  return byCourse;
}

// Rows of <topic|task>.groupBy({ by: ['courseId', 'status'], _count: { _all } })
//   -> Map courseId -> { completed, total }, where status DONE is completed.
function statusCountsByCourse(groups) {
  const counts = new Map();
  for (const g of groups) {
    const n = g._count?._all ?? 0;
    const c = counts.get(g.courseId) ?? { completed: 0, total: 0 };
    c.total += n;
    if (g.status === 'DONE') c.completed += n;
    counts.set(g.courseId, c);
  }
  return counts;
}

const NO_ITEMS = Object.freeze({ completed: 0, total: 0 });

// One row per course: focus minutes in the range + all-time progress.
//   minutes:     Map courseId -> focus minutes (minutesByCourse)
//   topicCounts: Map courseId -> { completed, total } over topics (statusCountsByCourse)
//   taskCounts:  Map courseId -> { completed, total } over tasks
// progressPct covers topics + tasks (what the dashboard shows); taskProgressPct covers tasks only
// (WBS 4.1.1: completed tasks / assigned tasks per course).
// Sorted by focus minutes (desc), then name, then id so the order is stable.
function courseBreakdown(courses, { minutes = new Map(), topicCounts = new Map(), taskCounts = new Map() } = {}) {
  return courses
    .map((course) => {
      const topic = topicCounts.get(course.id) ?? NO_ITEMS;
      const task = taskCounts.get(course.id) ?? NO_ITEMS;
      const completedItems = topic.completed + task.completed;
      const totalItems = topic.total + task.total;
      return {
        courseId: course.id,
        courseCode: course.code ?? null,
        courseName: course.name,
        focusMinutes: minutes.get(course.id) ?? 0,
        completedItems,
        totalItems,
        progressPct: progressPct(completedItems, totalItems),
        completedTasks: task.completed,
        totalTasks: task.total,
        taskProgressPct: progressPct(task.completed, task.total),
      };
    })
    .sort((a, b) => b.focusMinutes - a.focusMinutes || a.courseName.localeCompare(b.courseName) || a.courseId - b.courseId);
}

// Consecutive local days with at least one completed session, counted back from today.
// The streak is still alive when the last study day is yesterday (the student can study later today);
// a day without study before that ends it. No session today or yesterday -> 0.
function currentStreak(studyDates, today) {
  const days = studyDates instanceof Set ? studyDates : new Set(studyDates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// Set of local dates (tz) that have a session.
function studyDatesOf(sessions, tz) {
  return new Set(sessions.map((s) => localDate(s.startedAt, tz)));
}

// Zero-filled daily series for the `days` local dates ending today:
//   [{ date, focusMinutes, tasksCompleted }]
function dailySeries({ sessions, completedTasks, today, days, tz }) {
  const series = lastNDays(today, days).map((date) => ({ date, focusMinutes: 0, tasksCompleted: 0 }));
  const byDate = new Map(series.map((row) => [row.date, row]));
  for (const s of sessions) {
    const row = byDate.get(localDate(s.startedAt, tz));
    if (row) row.focusMinutes += s.minutes;
  }
  for (const t of completedTasks) {
    if (!t.completedAt) continue;
    const row = byDate.get(localDate(t.completedAt, tz));
    if (row) row.tasksCompleted += 1;
  }
  return series;
}

module.exports = {
  progressPct,
  totalMinutes,
  minutesByCourse,
  statusCountsByCourse,
  courseBreakdown,
  currentStreak,
  studyDatesOf,
  dailySeries,
};
