const { config } = require('./config');
const { prisma } = require('./db/client');
const { createApp } = require('./app');
const { createGeminiClient } = require('./llm/gemini');

const gemini = createGeminiClient(config);
if (config.llmMock) console.warn('LLM_MOCK=true: syllabus analysis returns the fixed 5-chapter sample, Gemini is not called');
else if (!gemini) console.warn('GEMINI_API_KEY is not set: POST /api/syllabus/extract will answer 503 LLM_NOT_CONFIGURED');

const app = createApp({ prisma, gemini });

// Auto-seed or verify demo account subtopics on startup
async function ensureDemoData() {
  try {
    const demoEmail = process.env.SEED_USER_EMAIL || 'student@sfsh.dev';
    const demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!demoUser) {
      console.log(`[seed] Demo user ${demoEmail} not found, seeding...`);
      const { seedDemoUser } = require('../prisma/seed');
      await seedDemoUser(prisma);
      console.log(`[seed] Demo user ${demoEmail} seeded successfully.`);
    } else {
      const subtopicsCount = await prisma.topic.count({
        where: {
          course: { userId: demoUser.id },
          parentId: { not: null },
        },
      });
      if (subtopicsCount === 0) {
        console.log(`[seed] Demo user ${demoEmail} has 0 subtopics, reseeding with subtopics...`);
        const { seedDemoUser } = require('../prisma/seed');
        await seedDemoUser(prisma);
        console.log(`[seed] Demo user ${demoEmail} reseeded with subtopics successfully.`);
      }
    }
  } catch (err) {
    console.error('[seed] Note: ensureDemoData skipped/failed:', err.message);
  }
}

ensureDemoData();

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
