const { urgencyOf } = require('./urgency');

// JSON shape of a task (Rule 02 `data.task` / `data.tasks[]`).
// daysLeft / urgencyBadge are computed at response time from `now` (WBS 2.4a.3), never stored.
function serializeTask(task, now = new Date()) {
  const { daysLeft, urgencyBadge } = urgencyOf(task, now);
  return {
    id: task.id,
    title: task.title,
    dueAt: task.dueAt,
    status: task.status,
    daysLeft,
    urgencyBadge,
    courseId: task.courseId,
    topicId: task.topicId,
    course: task.course ? { id: task.course.id, code: task.course.code, name: task.course.name } : null,
    topic: task.topic ? { id: task.topic.id, title: task.topic.title } : null,
    createdAt: task.createdAt,
    completedAt: task.completedAt ?? null,
  };
}

module.exports = { serializeTask };
