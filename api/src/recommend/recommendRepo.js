// WBS 3.1.1 — loads a user's open tasks and scores them with src/recommend/score.js.
//
// Rule 06: tasks are read through byUser(userId), the auto-link candidates through byCourseOwner(userId),
// so another user's tasks or topics can never enter the ranking. Nothing is written: the auto-link of a
// task without topic_id is resolved in memory for scoring only.

const { byUser, byCourseOwner } = require('../db/scope');
const { rankTasks } = require('./score');

const TOPIC_SELECT = { id: true, courseId: true, title: true, status: true, sortOrder: true, parentId: true };

const RECOMMEND_INCLUDE = {
  course: { select: { id: true, code: true, name: true } },
  topic: { select: TOPIC_SELECT },
};

// Every topic of the given courses grouped by course id. DONE topics are kept on purpose: defaultTopic()
// needs the chapters to place subtopics in syllabus order, and filters DONE itself.
async function loadLinkCandidates(prisma, userId, courseIds) {
  const byCourse = new Map();
  if (courseIds.length === 0) return byCourse;

  const topics = await prisma.topic.findMany({
    where: byCourseOwner(userId, { courseId: { in: courseIds } }),
    select: TOPIC_SELECT,
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
  });
  for (const topic of topics) {
    if (!byCourse.has(topic.courseId)) byCourse.set(topic.courseId, []);
    byCourse.get(topic.courseId).push(topic);
  }
  return byCourse;
}

// All not-DONE tasks of the user, scored and sorted by score (highest first).
//   -> [{ task, topic, topicAutoLinked, score, daysLeft, effDays, isOverdue, breakdown }]
async function scoreUserTasks(prisma, userId, { now = new Date() } = {}) {
  const tasks = await prisma.task.findMany({
    where: byUser(userId, { status: { not: 'DONE' } }),
    include: RECOMMEND_INCLUDE,
    orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
  });

  // Only tasks without a topic need the course's candidate list.
  const unlinkedCourseIds = [...new Set(tasks.filter((t) => t.topicId === null).map((t) => t.courseId))];
  const topicsByCourse = await loadLinkCandidates(prisma, userId, unlinkedCourseIds);

  return rankTasks(tasks, { topicsByCourse, now });
}

module.exports = { scoreUserTasks, loadLinkCandidates, RECOMMEND_INCLUDE };
