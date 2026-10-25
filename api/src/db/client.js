const { PrismaClient } = require('@prisma/client');

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__sfshPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__sfshPrisma = prisma;
}

module.exports = { prisma };
