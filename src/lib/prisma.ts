import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Only run safeguard at runtime (not build)
if (process.env.NODE_ENV === 'production') {
  (async () => {
    try {
      await prisma.$connect();
    } catch (err) {
      console.warn('⚠️ Prisma connection failed. Regenerating Prisma Client...');
      const { execSync } = await import('child_process');
      execSync('npx prisma generate', { stdio: 'inherit' });
      await prisma.$connect();
      console.log('✅ Prisma Client regenerated and connected successfully.');
    }
  })();
}