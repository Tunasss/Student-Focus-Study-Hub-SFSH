// WBS 2.4a.2 — Tasks CRUD.
//   GET    /api/tasks?course_id=&status=
//   POST   /api/tasks
//   PUT    /api/tasks/:id      (full representation)
//   PATCH  /api/tasks/:id      (partial, e.g. { status: "DONE" })
//   DELETE /api/tasks/:id
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../envelope');
const { parseOrThrow } = require('../validation');
const { taskInputSchema, taskPatchSchema, listQuerySchema, idParamSchema } = require('../tasks/schemas');
const { listTasks, createTask, updateTask, deleteTask } = require('../tasks/taskRepo');
const { serializeTask } = require('../tasks/serialize');

function tasksRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const filters = parseOrThrow(listQuerySchema, req.query);
    const tasks = await listTasks(prisma, req.userId, filters);
    // One clock reading for the whole list so every daysLeft / urgencyBadge agrees.
    const now = new Date();
    res.json(ok({ tasks: tasks.map((task) => serializeTask(task, now)) }));
  });

  router.post('/', async (req, res) => {
    const input = parseOrThrow(taskInputSchema, req.body);
    const task = await createTask(prisma, req.userId, input);
    res.status(201).json(ok({ task: serializeTask(task) }));
  });

  router.put('/:id', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const input = parseOrThrow(taskInputSchema, req.body);
    const task = await updateTask(prisma, req.userId, id, input);
    res.json(ok({ task: serializeTask(task) }));
  });

  router.patch('/:id', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const patch = parseOrThrow(taskPatchSchema, req.body);
    const task = await updateTask(prisma, req.userId, id, patch);
    res.json(ok({ task: serializeTask(task) }));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const task = await deleteTask(prisma, req.userId, id);
    res.json(ok({ id: task.id }));
  });

  return router;
}

module.exports = { tasksRouter };
