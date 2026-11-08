// WBS 3.1.3 — Recommendation API.
//   GET /api/recommendation/next-action?tz=Asia/Ho_Chi_Minh
const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../envelope');
const { parseOrThrow } = require('../validation');
const { DEFAULT_TZ, isValidTimeZone } = require('../ics/time');
const { nextAction, serializeNextAction } = require('../recommend/nextAction');

// `tz` only affects the local `nextClass.start` / `nextClass.end` strings of a TOPIC answer.
const querySchema = z.object({
  tz: z
    .string()
    .refine(isValidTimeZone, { error: 'must be an IANA timezone, e.g. Asia/Ho_Chi_Minh' })
    .default(DEFAULT_TZ),
});

function recommendationRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/next-action', async (req, res) => {
    const { tz } = parseOrThrow(querySchema, req.query);
    // One clock reading so the score, daysLeft and urgencyBadge of the answer agree.
    const now = new Date();
    const result = await nextAction(prisma, req.userId, { now, tz });
    res.json(ok(serializeNextAction(result, now)));
  });

  return router;
}

module.exports = { recommendationRouter };
