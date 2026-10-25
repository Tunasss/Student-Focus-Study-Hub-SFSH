const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { errorHandler, notFound } = require('./errors');
const { authRouter } = require('./routes/auth');

// prisma is injected so tests can pass a fake client.
function createApp({ prisma }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter({ prisma }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
