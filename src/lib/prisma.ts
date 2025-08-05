import { PrismaClient } from '@prisma/client';

// Extend the global type to hold a Prisma instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Optional logging in dev
  });

// Prevent multiple instances during hot-reload in dev
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Runtime safeguard: attempt connection and regenerate client if needed
(async () => {
  try {
    await prisma.$connect();
  } catch (err) {
    console.warn('⚠️ Prisma connection failed. Regenerating Prisma Client...');
    const { execSync } = await import('child_process');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      await prisma.$connect();
      console.log('✅ Prisma Client regenerated and connected successfully.');
    } catch (genErr) {
      console.error('❌ Prisma regeneration failed:', genErr);
    }
  }
})();