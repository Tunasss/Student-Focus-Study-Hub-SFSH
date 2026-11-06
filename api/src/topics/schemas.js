// WBS 2.2.4 — zod schemas for the topics endpoints.
//
// JSON uses `sortOrder` (the client's name; MySQL column `sort_order`, never the reserved word ORDER).
// Bulk items may also carry `order`, the field name of the Gemini preview from POST /api/syllabus/extract.

const { z } = require('zod');

const TOPIC_STATUSES = ['TODO', 'DOING', 'DONE'];
const LIMITS = Object.freeze({ maxTopics: 100, maxChapters: 50, titleMax: 255, descriptionMax: 2000 });

const ID_MESSAGE = 'must be a positive integer id';
const id = z.int({ error: ID_MESSAGE }).positive({ error: ID_MESSAGE });
const idFromString = z.coerce.number({ error: ID_MESSAGE }).pipe(id);

const title = z
  .string({ error: 'is required' })
  .trim()
  .min(1, { error: 'must not be empty' })
  .max(LIMITS.titleMax, { error: `must be at most ${LIMITS.titleMax} characters` });

const description = z
  .string()
  .trim()
  .max(LIMITS.descriptionMax, { error: `must be at most ${LIMITS.descriptionMax} characters` })
  .transform((s) => s || null)
  .nullable();

const sourceFile = z
  .string()
  .trim()
  .max(LIMITS.titleMax)
  .transform((s) => s || null)
  .nullable();

const status = z.enum(TOPIC_STATUSES, { error: `must be one of ${TOPIC_STATUSES.join(', ')}` });
const sortOrder = z.int({ error: 'must be a positive integer' }).positive({ error: 'must be a positive integer' });

// POST /api/courses/:id/topics — one topic. sortOrder defaults to the next free position.
const topicInputSchema = z
  .object({
    parentId: id.optional().nullable(),
    sourceFile: sourceFile.optional(),
    title,
    description: description.optional().default(null),
    status: status.default('TODO'),
    sortOrder: sortOrder.optional(),
  })
  .strict();

// One item of POST /api/courses/:id/topics/bulk. `order` (Gemini) or `sortOrder` (client) give the position;
// without either the array position is used.
const bulkTopicSchema = z
  .object({
    parentId: id.optional().nullable(),
    sourceFile: sourceFile.optional(),
    title,
    description: description.optional().default(null),
    status: status.optional(),
    order: sortOrder.optional(),
    sortOrder: sortOrder.optional(),
  })
  .strict();

const bulkSubtopicSchema = z
  .object({
    title,
    description: description.optional().default(null),
    status: status.optional(),
    order: sortOrder.optional(),
    sortOrder: sortOrder.optional(),
  })
  .strict();

const bulkChapterSchema = z
  .object({
    title,
    description: description.optional().default(null),
    sourceFile: sourceFile.optional(),
    status: status.optional(),
    order: sortOrder.optional(),
    sortOrder: sortOrder.optional(),
    subtopics: z.array(bulkSubtopicSchema).optional().default([]),
  })
  .strict();

const topicBulkSchema = z
  .object({
    mode: z.enum(['append', 'replace']).optional(),
    chapters: z.array(bulkChapterSchema, { error: 'must be an array of chapters' }).max(LIMITS.maxChapters).optional(),
    topics: z.array(bulkTopicSchema, { error: 'must be an array of topics' }).max(LIMITS.maxTopics).optional(),
  })
  .strict()
  .refine(
    (data) => {
      const hasChapters = Array.isArray(data.chapters) && data.chapters.length > 0;
      const hasTopics = Array.isArray(data.topics) && data.topics.length > 0;
      return hasChapters || hasTopics;
    },
    { error: 'must contain at least one topic', path: ['topics'] },
  );

// PATCH /api/topics/:id — status change or quick edit of title / description.
const topicPatchSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    status: status.optional(),
    sourceFile: sourceFile.optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, { error: 'at least one of title, description, status is required' });

const idParamSchema = z.object({ id: idFromString });

module.exports = {
  TOPIC_STATUSES,
  LIMITS,
  topicInputSchema,
  bulkChapterSchema,
  bulkSubtopicSchema,
  topicBulkSchema,
  topicPatchSchema,
  idParamSchema,
};
