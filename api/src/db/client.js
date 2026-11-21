const { PrismaClient } = require('@prisma/client');
const { isTransientDbError, withDbRetry } = require('./retry');

function createPrismaClient() {
  const base = new PrismaClient();
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return withDbRetry(() => query(args));
        },
      },
    },
  });
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__sfshPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__sfshPrisma = prisma;
}

module.exports = { prisma, isTransientDbError, withDbRetry };
