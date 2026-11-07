// WBS 3.1.1 — Core recommendation math engine: the priority score of a task.
//
//   days_left = ceil((due_at - now) / 24h)                     (src/tasks/urgency.js, WBS 2.4a.3)
//   eff_days  = max(days_left, 0)
//
//   score = 10 / (eff_days + 0.5)                              deadline pressure: 20 when overdue or due now,
//                                                              6.67 within 24h, 4 in two days, ~1 in ten days
//         + (topic.status == 'DOING' ? 5 : 2)                  topic link; 0 when there is no topic to link
//         + (is_overdue ? 3 : 0)                               is_overdue: due_at < now and status != DONE
//
// Rules:
//   - DONE tasks are never scored (rankTasks drops them).
//   - A task whose topic_id is null is scored against the course's first topic that is not DONE
//     (smallest sort_order, walking chapters and their subtopics in syllabus order; lowest id on a tie).
//     When the course has no such topic the topic term is 0. The link is computed, not written back.
//
// Everything here is pure: callers pass the task, its (resolved) topic and the clock.

const { daysLeft, urgencyBadge, URGENCY } = require('../tasks/urgency');

const WEIGHTS = Object.freeze({
  DEADLINE_NUMERATOR: 10,
  DEADLINE_OFFSET: 0.5,
  TOPIC_DOING: 5,
  TOPIC_OTHER: 2,
  TOPIC_NONE: 0,
  OVERDUE_BONUS: 3,
});

// Scores are rounded so JSON and tests are stable (1/3 -> 0.333).
const round = (n) => Math.round(n * 1000) / 1000;

// eff_days = max(days_left, 0): an overdue task counts as due today.
function effectiveDays(days) {
  return Math.max(days, 0);
}

function deadlineScore(effDays) {
  return WEIGHTS.DEADLINE_NUMERATOR / (effDays + WEIGHTS.DEADLINE_OFFSET);
}

// 5 for a DOING topic, 2 for any other linked topic, 0 when there is none.
function topicScore(topic) {
  if (!topic) return WEIGHTS.TOPIC_NONE;
  return topic.status === 'DOING' ? WEIGHTS.TOPIC_DOING : WEIGHTS.TOPIC_OTHER;
}

function isOverdue(task, now = new Date()) {
  return urgencyBadge(task, now) === URGENCY.OVERDUE;
}

function overdueScore(overdue) {
  return overdue ? WEIGHTS.OVERDUE_BONUS : 0;
}

// Position of a topic in syllabus order: [chapter sort_order, subtopic sort_order, ...]. sort_order is only
// unique among siblings (topics(course_id, parent_id, sort_order)), so "smallest sort_order" is read as the
// first topic of a depth-first walk of the tree. A topic whose parent is not in the list counts as a root.
function syllabusPath(topic, byId, depth = 0) {
  const parent = topic.parentId == null ? null : byId.get(topic.parentId);
  if (!parent || depth > 32) return [topic.sortOrder];
  return [...syllabusPath(parent, byId, depth + 1), topic.sortOrder];
}

function comparePaths(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length; // a chapter comes before its own subtopics
}

// The topic a task without topic_id is linked to: the course's first not-DONE topic in syllabus order, or null.
// Pass every topic of the course (DONE ones included) so subtopics can be placed under their chapter.
function defaultTopic(courseTopics = []) {
  const byId = new Map(courseTopics.map((t) => [t.id, t]));
  const candidates = courseTopics
    .filter((t) => t.status !== 'DONE')
    .map((t) => ({ topic: t, path: syllabusPath(t, byId) }))
    .sort((a, b) => comparePaths(a.path, b.path) || a.topic.id - b.topic.id);
  return candidates[0]?.topic ?? null;
}

// { topic, autoLinked }: the task's own topic when it has one, else defaultTopic(courseTopics).
function resolveTopic(task, courseTopics = []) {
  if (task.topic) return { topic: task.topic, autoLinked: false };
  if (task.topicId !== null && task.topicId !== undefined) {
    const own = courseTopics.find((t) => t.id === task.topicId);
    if (own) return { topic: own, autoLinked: false };
  }
  const topic = defaultTopic(courseTopics);
  return { topic, autoLinked: topic !== null };
}

// Scores one task against an already resolved topic (or null).
//   -> { score, daysLeft, effDays, isOverdue, breakdown: { deadline, topic, overdue } }
function scoreTask(task, { topic = null, now = new Date() } = {}) {
  const days = daysLeft(task.dueAt, now);
  const effDays = effectiveDays(days);
  const overdue = isOverdue(task, now);

  const deadline = deadlineScore(effDays);
  const breakdown = {
    deadline: round(deadline),
    topic: topicScore(topic),
    overdue: overdueScore(overdue),
  };
  const score = round(deadline + breakdown.topic + breakdown.overdue);

  return { score, daysLeft: days, effDays, isOverdue: overdue, breakdown };
}

// Highest score first; ties go to the sooner deadline, then the lower id.
function compareRanked(a, b) {
  if (a.score !== b.score) return b.score - a.score;
  const aDue = new Date(a.task.dueAt).getTime();
  const bDue = new Date(b.task.dueAt).getTime();
  if (aDue !== bDue) return aDue - bDue;
  return a.task.id - b.task.id;
}

// Scores and ranks a list of tasks. DONE tasks are skipped.
//   tasks:          rows with { id, courseId, topicId, dueAt, status, topic? } (topic needs `status`)
//   topicsByCourse: Map<courseId, Topic[]> (or plain object) used to auto-link tasks without a topic
//   -> [{ task, topic, topicAutoLinked, score, daysLeft, effDays, isOverdue, breakdown }] sorted by score desc
function rankTasks(tasks, { topicsByCourse = new Map(), now = new Date() } = {}) {
  const topicsOf = (courseId) =>
    (topicsByCourse instanceof Map ? topicsByCourse.get(courseId) : topicsByCourse[courseId]) ?? [];

  return tasks
    .filter((task) => task.status !== 'DONE')
    .map((task) => {
      const { topic, autoLinked } = resolveTopic(task, topicsOf(task.courseId));
      return { task, topic, topicAutoLinked: autoLinked, ...scoreTask(task, { topic, now }) };
    })
    .sort(compareRanked);
}

module.exports = {
  WEIGHTS,
  effectiveDays,
  deadlineScore,
  topicScore,
  isOverdue,
  overdueScore,
  defaultTopic,
  resolveTopic,
  scoreTask,
  rankTasks,
};
