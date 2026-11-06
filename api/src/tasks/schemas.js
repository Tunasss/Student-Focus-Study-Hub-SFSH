// WBS 2.4a — zod schemas for the tasks endpoints.
// Body fields are camelCase like the rest of the JSON API (PRD names: title, due_at, course_id, topic_id, status).

const { z } = require('zod');

const TASK_STATUSES = ['TODO', 'DOING', 'DONE', 'OVERDUE'];

const ID_MESSAGE = 'must be a positive integer id';
const id = z.int({ error: ID_MESSAGE }).positive({ error: ID_MESSAGE });
// For query/path params (strings).
const idFromString = z.coerce.number({ error: ID_MESSAGE }).pipe(id);

const title = z
  .string({ error: 'is required' })
  .trim()
  .min(1, { error: 'must not be empty' })
  .max(255, { error: 'must be at most 255 characters' });

// ISO-8601 date-time with an explicit offset or Z, e.g. 2026-11-20T23:59:00+07:00.
const dueAt = z
  .iso.datetime({ offset: true, error: 'must be an ISO-8601 date-time with timezone, e.g. 2026-11-20T23:59:00+07:00' })
  .transform((s) => new Date(s));

const status = z.enum(TASK_STATUSES, { error: `must be one of ${TASK_STATUSES.join(', ')}` });

// POST /api/tasks and PUT /api/tasks/:id (full representation).
const taskInputSchema = z
  .object({
    title,
    dueAt,
    courseId: id,
    topicId: id.nullable().default(null),
    status: status.default('TODO'),
  })
  .strict();

// PATCH /api/tasks/:id — any subset, at least one field.
const taskPatchSchema = z
  .object({
    title: title.optional(),
    dueAt: dueAt.optional(),
    courseId: id.optional(),
    topicId: id.nullable().optional(),
    status: status.optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, { error: 'at least one field is required' });

// GET /api/tasks?course_id=&status=   (courseId is accepted as an alias of course_id)
const listQuerySchema = z
  .object({
    course_id: idFromString.optional(),
    courseId: idFromString.optional(),
    status: status.optional(),
  })
  .transform((q) => ({ courseId: q.course_id ?? q.courseId, status: q.status }));

const idParamSchema = z.object({ id: idFromString });

module.exports = { TASK_STATUSES, taskInputSchema, taskPatchSchema, listQuerySchema, idParamSchema };
