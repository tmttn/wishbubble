import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isUpstashConfigured } from "@/lib/rate-limit";
import { env } from "@/lib/env";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: "ok" | "error";
    redis: "ok" | "error" | "not_configured";
  };
  details?: Record<string, unknown>;
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus["checks"] = {
    database: "error",
    redis: "not_configured",
  };
  let overallStatus: HealthStatus["status"] = "healthy";

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    checks.database = "error";
    overallStatus = "unhealthy";
    console.error("Health check - database error:", error);
  }

  // Check Redis if configured
  if (isUpstashConfigured()) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: env.UPSTASH_REDIS_REST_URL!,
        token: env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.ping();
      checks.redis = "ok";
    } catch (error) {
      checks.redis = "error";
      if (overallStatus === "healthy") {
        overallStatus = "degraded";
      }
      console.error("Health check - redis error:", error);
    }
  }

  const responseTime = Date.now() - startTime;

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks,
    details: {
      responseTimeMs: responseTime,
      nodeEnv: env.NODE_ENV,
    },
  };

  return NextResponse.json(health, {
    status: overallStatus === "unhealthy" ? 503 : 200,
  });
}
