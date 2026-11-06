const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { errorHandler, notFound } = require('./errors');
const { ok } = require('./envelope');
const { docsRouter } = require('./docs');
const { authRouter } = require('./routes/auth');
const { coursesRouter } = require('./routes/courses');
const { scheduleRouter } = require('./routes/schedule');
const { tasksRouter } = require('./routes/tasks');
const { syllabusRouter } = require('./routes/syllabus');

// prisma and the Gemini client are injected so tests can pass fakes. gemini may be null (not configured).
function createApp({ prisma, gemini = null }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json(ok({ status: 'ok' }));
  });

  app.use('/api-docs', docsRouter());

  app.use('/api/auth', authRouter({ prisma }));
  app.use('/api/courses', coursesRouter({ prisma }));
  app.use('/api/schedule', scheduleRouter({ prisma }));
  app.use('/api/tasks', tasksRouter({ prisma }));
  app.use('/api/syllabus', syllabusRouter({ gemini }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
