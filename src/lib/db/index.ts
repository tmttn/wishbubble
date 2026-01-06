import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/lib/env";

// Check if we're in a build phase (Next.js build)
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient() {
  // During build phase, we can't create a real client - return a placeholder that will error if used
  if (isBuildPhase || !env.DATABASE_URL) {
    // Return a proxy that throws helpful errors during build
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === "then") return undefined; // For promise detection
        throw new Error(
          `Prisma client not available during build. Tried to access "${String(prop)}"`
        );
      },
    });
  }

  return new PrismaClient({
    accelerateUrl: env.DATABASE_URL,
    log:
      env.NODE_ENV === "development"
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
  if (!env.DIRECT_DATABASE_URL) {
    // Fallback to Accelerate if no direct URL configured
    return createPrismaClient();
  }

  // Configure SSL based on environment
  // In production: require proper certificate verification
  // In development: allow self-signed certs for local database providers
  // Override with DB_SSL_REJECT_UNAUTHORIZED=false for cloud providers with non-standard certs
  const sslRejectUnauthorized =
    env.DB_SSL_REJECT_UNAUTHORIZED === "false"
      ? false
      : env.NODE_ENV === "production";

  // Use the PrismaPg adapter for direct connections (bypasses Accelerate)
  const pool = new Pool({
    connectionString: env.DIRECT_DATABASE_URL,
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
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isBuildPhase && env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
