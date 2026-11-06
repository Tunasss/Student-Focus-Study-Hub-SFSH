const { config } = require('./config');
const { prisma } = require('./db/client');
const { createApp } = require('./app');
const { createGeminiClient } = require('./llm/gemini');

const gemini = createGeminiClient(config);
if (config.llmMock) console.warn('LLM_MOCK=true: syllabus analysis returns the fixed 5-chapter sample, Gemini is not called');
else if (!gemini) console.warn('GEMINI_API_KEY is not set: POST /api/syllabus/extract will answer 503 LLM_NOT_CONFIGURED');

const app = createApp({ prisma, gemini });

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
