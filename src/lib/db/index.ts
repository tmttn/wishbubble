import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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
 *
 * Note: This uses the DIRECT_DATABASE_URL env var which should be a
 * direct postgres:// connection string, not a prisma:// Accelerate URL
 */
export function createDirectPrismaClient() {
  const directUrl = process.env.DIRECT_DATABASE_URL;

  if (!directUrl) {
    // Fallback to Accelerate if no direct URL configured
    return createPrismaClient();
  }

  // Configure SSL based on environment
  // In production: require proper certificate verification
  // In development: allow self-signed certs for local database providers
  // Override with DB_SSL_REJECT_UNAUTHORIZED=false for cloud providers with non-standard certs
  const sslRejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
      ? false
      : process.env.NODE_ENV === "production";

  // Use the PrismaPg adapter for direct connections (bypasses Accelerate)
  const pool = new Pool({
    connectionString: directUrl,
    ssl: {
      rejectUnauthorized: sslRejectUnauthorized,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
