// WBS 2.2.4 — single topic lifecycle.
//   PATCH  /api/topics/:id   status change (TODO / DOING / DONE) or quick edit of title / description
//   DELETE /api/topics/:id
// (List / create / bulk save live under /api/courses/:id/topics in routes/courses.js.)
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../envelope');
const { parseOrThrow } = require('../validation');
const { topicPatchSchema, idParamSchema } = require('../topics/schemas');
const { updateTopic, deleteTopic, serializeTopic } = require('../topics/topicRepo');

function topicsRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  router.patch('/:id', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const patch = parseOrThrow(topicPatchSchema, req.body);
    const topic = await updateTopic(prisma, req.userId, id, patch);
    res.json(ok({ topic: serializeTopic(topic) }));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const topic = await deleteTopic(prisma, req.userId, id);
    res.json(ok({ id: topic.id }));
  });

  return router;
}

module.exports = { topicsRouter };
