import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient() {
  // DATABASE_URL must be an Accelerate URL (prisma+postgres://accelerate...)
  const accelerateUrl = process.env.DATABASE_URL;

  if (!accelerateUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return new PrismaClient({
    accelerateUrl,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/**
 * Create a direct database connection (bypasses Prisma Accelerate)
 * Use for long-running operations that may timeout with Accelerate
 */
export function createDirectPrismaClient() {
  const directUrl = process.env.DIRECT_DATABASE_URL;

  if (!directUrl) {
    // Fallback to Accelerate if no direct URL configured
    return createPrismaClient();
  }

  return new PrismaClient({
    datasourceUrl: directUrl,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
