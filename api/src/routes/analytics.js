// WBS 3.4.2 — Dashboard summary & breakdown endpoints.
//   GET /api/analytics/overview?range=7d|30d|all&tz=Asia/Ho_Chi_Minh
//   GET /api/analytics/daily-activity?range=7d|30d&tz=Asia/Ho_Chi_Minh
// A user with no data gets zeroed metrics (200), never 404.
//
// All timestamps are stored and returned in UTC; the client displays them in local time.
// `tz` only decides where a calendar day starts and ends (today, streaks, the daily buckets),
// because a per-day sum cannot be re-bucketed by the client. The client should send its own zone
// (Intl.DateTimeFormat().resolvedOptions().timeZone); without it, days are UTC days.
const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../envelope');
const { parseOrThrow } = require('../validation');
const { isValidTimeZone } = require('../ics/time');
const { overview, dailyActivity } = require('../analytics/analyticsRepo');

const tz = z
  .string()
  .refine(isValidTimeZone, { error: 'must be an IANA timezone, e.g. Asia/Ho_Chi_Minh' })
  .default('UTC');

const overviewQuerySchema = z.object({
  range: z.enum(['7d', '30d', 'all'], { error: 'must be one of 7d, 30d, all' }).default('7d'),
  tz,
});

const dailyQuerySchema = z.object({
  range: z.enum(['7d', '30d'], { error: 'must be one of 7d, 30d' }).default('7d'),
  tz,
});

function analyticsRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/overview', async (req, res) => {
    const query = parseOrThrow(overviewQuerySchema, req.query);
    res.json(ok(await overview(prisma, req.userId, { ...query, now: new Date() })));
  });

  router.get('/daily-activity', async (req, res) => {
    const query = parseOrThrow(dailyQuerySchema, req.query);
    res.json(ok(await dailyActivity(prisma, req.userId, { ...query, now: new Date() })));
  });

  return router;
}

module.exports = { analyticsRouter };
