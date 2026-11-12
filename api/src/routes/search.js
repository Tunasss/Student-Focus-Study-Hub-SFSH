// WBS 3.4 — completion suggestions for the search box.
//   GET /api/search/suggest?q=dat&limit=8
const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../envelope');
const { parseOrThrow } = require('../validation');
const { SUGGEST_LIMIT, suggest } = require('../search/suggest');

const suggestQuerySchema = z.object({
  q: z
    .string({ error: 'is required' })
    .trim()
    .min(1, { error: 'must not be empty' })
    .max(100, { error: 'must be at most 100 characters' }),
  limit: z.coerce
    .number({ error: 'must be a number' })
    .pipe(z.int({ error: 'must be an integer' }).min(1).max(SUGGEST_LIMIT.max))
    .default(SUGGEST_LIMIT.default),
});

function searchRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/suggest', async (req, res) => {
    const { q, limit } = parseOrThrow(suggestQuerySchema, req.query);
    res.json(ok({ query: q, suggestions: await suggest(prisma, req.userId, { q, limit }) }));
  });

  return router;
}

module.exports = { searchRouter };
