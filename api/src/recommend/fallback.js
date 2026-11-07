// WBS 3.1.2 — what to recommend when the user has no open task.
//
//   1. Order the user's courses by their next class on the timetable (soonest first). Courses with no
//      upcoming class come after those with one, so a student without an .ics import still gets a topic.
//   2. For the first course that has one, suggest its DOING topic; failing that its first TODO topic
//      (both in syllabus order, see score.js syllabusOrder).
//   3. Nothing at all (no course with an open topic) -> null: the API answers with the empty state.
//
// Pure in pickFallbackTopic(); loadFallbackTopic() reads the rows under Rule 06 scoping.

const { byUser, byCourseOwner } = require('../db/scope');
const { expandSchedules } = require('../ics/expandSchedule');
const { DEFAULT_TZ } = require('../ics/time');
const { syllabusOrder } = require('./score');

const DAY_MS = 24 * 60 * 60 * 1000;
// Weekly slots repeat every 1 or 2 weeks, so four weeks is enough to find the next class of every course.
const HORIZON_DAYS = 28;

// First upcoming occurrence per course: Map<courseId, ClassOccurrence>. `schedules` carry their course.
function nextClassByCourse(schedules, now, { tz = DEFAULT_TZ, horizonDays = HORIZON_DAYS } = {}) {
  const to = new Date(now.getTime() + horizonDays * DAY_MS);
  const next = new Map();
  for (const event of expandSchedules(schedules, now, to, tz)) {
    if (new Date(event.startUtc) < now) continue; // the class already started
    if (!next.has(event.courseId)) next.set(event.courseId, event);
  }
  return next;
}

// DOING topic first, else the first TODO topic, both in syllabus order. null when the course has neither.
function pickTopicOfCourse(courseTopics) {
  const ordered = syllabusOrder(courseTopics);
  return ordered.find((t) => t.status === 'DOING') ?? ordered.find((t) => t.status === 'TODO') ?? null;
}

// courses: [{ id, code, name }], topics: every topic of those courses, schedules: slots with `course` included.
//   -> { course, topic, nextClass, reason } | null
function pickFallbackTopic({ courses = [], topics = [], schedules = [] }, { now = new Date(), tz = DEFAULT_TZ } = {}) {
  const nextClass = nextClassByCourse(schedules, now, { tz });
  const topicsByCourse = new Map();
  for (const topic of topics) {
    if (!topicsByCourse.has(topic.courseId)) topicsByCourse.set(topic.courseId, []);
    topicsByCourse.get(topic.courseId).push(topic);
  }

  const startOf = (course) => (nextClass.has(course.id) ? new Date(nextClass.get(course.id).startUtc).getTime() : Infinity);
  const ordered = [...courses].sort((a, b) => startOf(a) - startOf(b) || a.id - b.id);

  for (const course of ordered) {
    const topic = pickTopicOfCourse(topicsByCourse.get(course.id) ?? []);
    if (!topic) continue;
    const klass = nextClass.get(course.id) ?? null;
    const what = topic.status === 'DOING' ? 'the topic in progress' : 'the first TODO topic';
    const when = klass ? `next class ${klass.start} (${tz})` : 'no upcoming class on the timetable';
    return {
      course: { id: course.id, code: course.code ?? null, name: course.name },
      topic,
      nextClass: klass,
      reason: `No open task. "${topic.title}" is ${what} of ${course.name}, ${when}.`,
    };
  }
  return null;
}

async function loadFallbackTopic(prisma, userId, { now = new Date(), tz = DEFAULT_TZ } = {}) {
  const [courses, topics, schedules] = await Promise.all([
    prisma.course.findMany({ where: byUser(userId), select: { id: true, code: true, name: true } }),
    prisma.topic.findMany({
      where: byCourseOwner(userId),
      select: { id: true, courseId: true, parentId: true, sortOrder: true, title: true, status: true },
    }),
    prisma.schedule.findMany({
      where: byCourseOwner(userId),
      include: { course: { select: { id: true, code: true, name: true } } },
    }),
  ]);
  return pickFallbackTopic({ courses, topics, schedules }, { now, tz });
}

module.exports = { HORIZON_DAYS, nextClassByCourse, pickTopicOfCourse, pickFallbackTopic, loadFallbackTopic };
