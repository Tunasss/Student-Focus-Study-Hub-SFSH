// JSON shape of a task (Rule 02 `data.task` / `data.tasks[]`).
function serializeTask(task) {
  return {
    id: task.id,
    title: task.title,
    dueAt: task.dueAt,
    status: task.status,
    courseId: task.courseId,
    topicId: task.topicId,
    course: task.course ? { id: task.course.id, code: task.course.code, name: task.course.name } : null,
    topic: task.topic ? { id: task.topic.id, title: task.topic.title } : null,
    createdAt: task.createdAt,
  };
}

module.exports = { serializeTask };
