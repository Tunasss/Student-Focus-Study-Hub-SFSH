const { config } = require('./config');
const { prisma } = require('./db/client');
const { createApp } = require('./app');

const app = createApp({ prisma });

const server = app.listen(config.port, () => {
  console.log(`SFSH API listening on port ${config.port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
