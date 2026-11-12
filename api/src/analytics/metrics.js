// WBS 3.4.1 — pure aggregation math for study analytics (no I/O, easy to unit test).
//
// Inputs are rows already scoped to one user by analyticsRepo.js (Rule 06).

const { localDate, addDays, lastNDays } = require('./dates');

// progress_pct = floor(completed / total * 100), 0 when there is nothing to complete.
// Integer arithmetic (completed * 100 first) avoids float artefacts such as 29 / 100 * 100 = 28.999…
function progressPct(completed, total) {
  if (!Number.isInteger(total) || total <= 0) return 0;
  return Math.floor((completed * 100) / total);
}

const sumMinutes = (sessions) => sessions.reduce((sum, s) => sum + s.minutes, 0);

// Map courseId -> focus minutes. Sessions without a course (free focus) are skipped here;
// they still count towards the user's total.
function focusMinutesByCourse(sessions) {
  const byCourse = new Map();
  for (const s of sessions) {
    if (s.courseId === null || s.courseId === undefined) continue;
    byCourse.set(s.courseId, (byCourse.get(s.courseId) ?? 0) + s.minutes);
  }
  return byCourse;
}

// Map courseId -> { completed, total } over the course's topics and tasks (DONE = completed).
function itemCountsByCourse(topics, tasks) {
  const counts = new Map();
  const bump = (courseId, done) => {
    const c = counts.get(courseId) ?? { completed: 0, total: 0 };
    c.total += 1;
    if (done) c.completed += 1;
    counts.set(courseId, c);
  };
  for (const t of topics) bump(t.courseId, t.status === 'DONE');
  for (const t of tasks) bump(t.courseId, t.status === 'DONE');
  return counts;
}

// One row per course: focus minutes in the range + all-time progress.
// Sorted by focus minutes (desc), then name, then id so the order is stable.
function courseBreakdown(courses, { sessions, topics, tasks }) {
  const minutes = focusMinutesByCourse(sessions);
  const items = itemCountsByCourse(topics, tasks);
  return courses
    .map((course) => {
      const { completed, total } = items.get(course.id) ?? { completed: 0, total: 0 };
      return {
        courseId: course.id,
        courseCode: course.code ?? null,
        courseName: course.name,
        focusMinutes: minutes.get(course.id) ?? 0,
        completedItems: completed,
        totalItems: total,
        progressPct: progressPct(completed, total),
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
  sumMinutes,
  focusMinutesByCourse,
  itemCountsByCourse,
  courseBreakdown,
  currentStreak,
  studyDatesOf,
  dailySeries,
};
