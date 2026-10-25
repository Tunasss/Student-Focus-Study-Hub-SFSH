const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { byUser } = require('../db/scope');
const { timeFromDb, dateFromDb } = require('../ics/time');

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

    res.json({
      courses: courses.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        schedules: c.schedules.map(serializeSchedule),
      })),
    });
  });

  return router;
}

module.exports = { coursesRouter };
