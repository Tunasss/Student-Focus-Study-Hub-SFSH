// WBS 3.4 — zod schemas for the focus-session endpoints.
// Body fields are camelCase like the rest of the JSON API; query params follow the tasks endpoint spelling.

const { z } = require('zod');

const SESSION_STATUSES = ['COMPLETED', 'ABANDONED'];
// sessions.minutes is a SMALLINT; a single focus block longer than 4 hours is almost certainly a client bug.
const MAX_MINUTES = 240;
const LIST_LIMIT = Object.freeze({ default: 50, max: 200 });

const ID_MESSAGE = 'must be a positive integer id';
const id = z.int({ error: ID_MESSAGE }).positive({ error: ID_MESSAGE });
const idFromString = z.coerce.number({ error: ID_MESSAGE }).pipe(id);

const isoDateTime = z
  .iso.datetime({ offset: true, error: 'must be an ISO-8601 date-time with timezone, e.g. 2026-11-12T20:00:00+07:00' })
  .transform((s) => new Date(s));

const status = z.enum(SESSION_STATUSES, { error: `must be one of ${SESSION_STATUSES.join(', ')}` });

// POST /api/sessions — log one finished (or abandoned) focus block.
const sessionInputSchema = z
  .object({
    startedAt: isoDateTime,
    minutes: z
      .int({ error: 'must be a whole number of minutes' })
      .min(1, { error: 'must be at least 1' })
      .max(MAX_MINUTES, { error: `must be at most ${MAX_MINUTES}` }),
    status: status.default('COMPLETED'),
    courseId: id.nullable().optional(),
    topicId: id.nullable().optional(),
    taskId: id.nullable().optional(),
  })
  .strict();

// GET /api/sessions?from=&to=&course_id=&status=&limit=
const listQuerySchema = z
  .object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    course_id: idFromString.optional(),
    courseId: idFromString.optional(),
    status: status.optional(),
    limit: z.coerce
      .number({ error: 'must be a number' })
      .pipe(z.int({ error: 'must be an integer' }).min(1).max(LIST_LIMIT.max))
      .default(LIST_LIMIT.default),
  })
  .refine((q) => !q.from || !q.to || q.from < q.to, { error: 'from must be before to', path: ['from'] })
  .transform((q) => ({ from: q.from, to: q.to, courseId: q.course_id ?? q.courseId, status: q.status, limit: q.limit }));

module.exports = { SESSION_STATUSES, MAX_MINUTES, LIST_LIMIT, sessionInputSchema, listQuerySchema };
