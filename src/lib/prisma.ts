import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Fail fast with a clear message; avoids mysterious P1013 at runtime
  throw new Error(
    "Database URL is not set. Ensure DATABASE_URL is configured."
  );
}

// Reuse the client across hot reloads in dev to prevent creating too many connections
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Optional: you may connect lazily inside route handlers rather than here to avoid build-time connections.