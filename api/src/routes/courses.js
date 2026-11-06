const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { byUser } = require('../db/scope');
const { ok } = require('../envelope');
const { timeFromDb, dateFromDb } = require('../ics/time');
const { parseOrThrow } = require('../validation');
const { topicInputSchema, topicBulkSchema, idParamSchema } = require('../topics/schemas');
const { listTopics, createTopic, saveHierarchicalTopics, serializeTopic } = require('../topics/topicRepo');

function serializeSchedule(s) {
  return {
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: timeFromDb(s.startTime),
    endTime: timeFromDb(s.endTime),
    location: s.location,
    tz: s.tz,
    recurrenceUntil: dateFromDb(s.recurrenceUntil),
    intervalWeeks: s.intervalWeeks,
    startsAtUtc: s.startsAtUtc,
    endsAtUtc: s.endsAtUtc,
    exdates: s.exdates ?? [],
    source: s.icsUid !== null ? 'ics' : 'manual',
  };
}

function coursesRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  // GET /api/courses — the user's courses with their weekly slots
  router.get('/', async (req, res) => {
    const courses = await prisma.course.findMany({
      where: byUser(req.userId),
      include: { schedules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } },
      orderBy: [{ code: 'asc' }, { name: 'asc' }],
    });

    res.json(
      ok({
        courses: courses.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          schedules: c.schedules.map(serializeSchedule),
        })),
      }),
    );
  });

  // ---- Syllabus topics of a course (WBS 2.2.4) ----

  // GET /api/courses/:id/topics — the course's topics in sortOrder
  router.get('/:id/topics', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const topics = await listTopics(prisma, req.userId, id);
    res.json(ok({ topics: topics.map(serializeTopic) }));
  });

  // POST /api/courses/:id/topics — one topic (manual entry form)
  router.post('/:id/topics', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const input = parseOrThrow(topicInputSchema, req.body);
    const topic = await createTopic(prisma, req.userId, id, input);
    res.status(201).json(ok({ topic: serializeTopic(topic) }));
  });

  // POST /api/courses/:id/topics/bulk — save the reviewed syllabus preview (hierarchical or flat, append or replace)
  router.post('/:id/topics/bulk', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const body = parseOrThrow(topicBulkSchema, req.body);
    const result = await saveHierarchicalTopics(prisma, req.userId, id, body);
    res.status(201).json(ok({ topics: result.topics.map(serializeTopic), replaced: result.replaced }));
  });

  return router;
}

module.exports = { coursesRouter };
