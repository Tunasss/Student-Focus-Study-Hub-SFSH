// WBS 3.4 — Focus session logging (feeds the analytics endpoints).
//   POST /api/sessions   log one focus block (COMPLETED or ABANDONED)
//   GET  /api/sessions?from=&to=&course_id=&status=&limit=
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../envelope');
const { parseOrThrow } = require('../validation');
const { sessionInputSchema, listQuerySchema } = require('../sessions/schemas');
const { createSession, listSessions, serializeSession } = require('../sessions/sessionRepo');

function sessionsRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const filters = parseOrThrow(listQuerySchema, req.query);
    const sessions = await listSessions(prisma, req.userId, filters);
    res.json(ok({ sessions: sessions.map(serializeSession) }));
  });

  router.post('/', async (req, res) => {
    const input = parseOrThrow(sessionInputSchema, req.body);
    const session = await createSession(prisma, req.userId, input);
    res.status(201).json(ok({ session: serializeSession(session) }));
  });

  return router;
}

module.exports = { sessionsRouter };
