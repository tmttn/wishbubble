/**
 * Rate limiting module with support for both in-memory and distributed (Upstash Redis) backends.
 *
 * - In development or when UPSTASH_REDIS_REST_URL is not set: uses in-memory rate limiting
 * - In production with Upstash configured: uses distributed rate limiting that works across serverless instances
 *
 * IMPORTANT: In-memory rate limiting does NOT work properly in serverless environments like Vercel
 * because each function invocation may have a fresh memory space. Configure Upstash Redis for production.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
  /** Unique identifier for this rate limiter (e.g., route name) */
  name: string;
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  /** True if this is the first time hitting the limit (for this window) */
  firstExceeded?: boolean;
}

export interface CheckRateLimitOptions {
  /** User agent string for logging */
  userAgent?: string;
  /** Whether to log and notify admins when limit is exceeded (default: true) */
  logExceeded?: boolean;
}

// ============================================
// UPSTASH REDIS RATE LIMITER (PRODUCTION)
// ============================================

let redis: Redis | null = null;
let upstashLimiters: Map<string, Ratelimit> = new Map();

/**
 * Check if Upstash Redis is configured
 */
export function isUpstashConfigured(): boolean {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Get or create an Upstash rate limiter for a specific config
 */
function getUpstashLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.name}:${config.limit}:${config.windowMs}`;

  if (!upstashLimiters.has(key)) {
    if (!redis) {
      redis = new Redis({
        url: env.UPSTASH_REDIS_REST_URL!,
        token: env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }

    // Convert windowMs to appropriate duration string
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    let duration: `${number} s` | `${number} m` | `${number} h` | `${number} d`;

    if (windowSeconds >= 86400) {
      duration = `${Math.ceil(windowSeconds / 86400)} d`;
    } else if (windowSeconds >= 3600) {
      duration = `${Math.ceil(windowSeconds / 3600)} h`;
    } else if (windowSeconds >= 60) {
      duration = `${Math.ceil(windowSeconds / 60)} m`;
    } else {
      duration = `${windowSeconds} s`;
    }

    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, duration),
      prefix: `ratelimit:${config.name}`,
      analytics: true, // Enable analytics for Upstash dashboard
    });

    upstashLimiters.set(key, limiter);
  }

  return upstashLimiters.get(key)!;
}

/**
 * Check rate limit using Upstash Redis (production)
 */
async function checkRateLimitUpstash(
  identifier: string,
  config: RateLimitConfig,
  options: CheckRateLimitOptions = {}
): Promise<RateLimitResult> {
  const { userAgent, logExceeded = true } = options;

  try {
    const limiter = getUpstashLimiter(config);
    const result = await limiter.limit(identifier);

    const rateLimitResult: RateLimitResult = {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset,
    };

    // Log if rate limit exceeded
    if (!result.success && logExceeded) {
      // Use a separate key to track if we've already notified for this window
      const notifyKey = `ratelimit:notified:${config.name}:${identifier}`;
      const alreadyNotified = await redis!.get(notifyKey);

      if (!alreadyNotified) {
        rateLimitResult.firstExceeded = true;
        // Set notification flag with same TTL as the rate limit window
        await redis!.set(notifyKey, "1", { ex: Math.ceil(config.windowMs / 1000) });
        // Fire and forget - don't await
        logRateLimitExceeded(identifier, config, userAgent).catch(() => {});
      } else {
        rateLimitResult.firstExceeded = false;
      }
    }

    return rateLimitResult;
  } catch (error) {
    // If Upstash fails, fall back to allowing the request (fail open)
    // but log the error so we know there's an issue
    logger.error("Upstash rate limit check failed, allowing request", error, {
      route: config.name,
      identifier,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetAt: Date.now() + config.windowMs,
    };
  }
}

// ============================================
// IN-MEMORY RATE LIMITER (DEVELOPMENT/FALLBACK)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  notifiedAt?: number;
}

// Store rate limit data per route (only works in single-instance)
const rateLimitStores = new Map<string, Map<string, RateLimitEntry>>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [, store] of rateLimitStores) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) {
          store.delete(key);
        }
      }
    }
  }, CLEANUP_INTERVAL);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Check rate limit using in-memory storage (development only)
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig,
  options: CheckRateLimitOptions = {}
): RateLimitResult {
  const { userAgent, logExceeded = true } = options;

  startCleanup();

  let store = rateLimitStores.get(config.name);
  if (!store) {
    store = new Map();
    rateLimitStores.set(config.name, store);
  }

  const now = Date.now();
  const entry = store.get(identifier);

  // If no entry or expired, create new one
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(identifier, newEntry);
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    const firstExceeded = !entry.notifiedAt;

    if (firstExceeded && logExceeded) {
      entry.notifiedAt = now;
      logRateLimitExceeded(identifier, config, userAgent).catch(() => {});
    }

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
      firstExceeded,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ============================================
// UNIFIED API
// ============================================

/**
 * Check rate limit for a given identifier (usually IP address or user ID)
 *
 * Uses Upstash Redis in production when configured, falls back to in-memory for development.
 *
 * @example
 * ```ts
 * const ip = getClientIp(request);
 * const result = await checkRateLimit(ip, rateLimiters.auth);
 *
 * if (!result.success) {
 *   return Response.json({ error: "Too many requests" }, {
 *     status: 429,
 *     headers: {
 *       "X-RateLimit-Limit": String(result.limit),
 *       "X-RateLimit-Remaining": String(result.remaining),
 *       "X-RateLimit-Reset": String(result.resetAt),
 *     }
 *   });
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  options: CheckRateLimitOptions = {}
): Promise<RateLimitResult> {
  if (isUpstashConfigured()) {
    return checkRateLimitUpstash(identifier, config, options);
  }

  // Warn in production if Upstash is not configured
  if (env.NODE_ENV === "production") {
    logger.warn("Upstash Redis not configured, using in-memory rate limiting (not recommended for production)", {
      route: config.name,
    });
  }

  return checkRateLimitMemory(identifier, config, options);
}

/**
 * Synchronous rate limit check (in-memory only)
 *
 * Use this only when you need synchronous behavior and understand the limitations.
 * This will NOT work properly in serverless environments.
 */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig,
  options: CheckRateLimitOptions = {}
): RateLimitResult {
  return checkRateLimitMemory(identifier, config, options);
}

// ============================================
// HELPERS
// ============================================

/**
 * Log rate limit exceeded event and notify admins (fire and forget)
 */
async function logRateLimitExceeded(
  identifier: string,
  config: RateLimitConfig,
  userAgent?: string
): Promise<void> {
  try {
    // Create activity log entry
    await prisma.activity.create({
      data: {
        type: "RATE_LIMIT_EXCEEDED",
        metadata: {
          route: config.name,
          identifier,
          limit: config.limit,
          windowMs: config.windowMs,
          userAgent,
        },
      },
    });

    // Get admin emails from env var
    const adminEmailsFromEnv =
      env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];

    // Get all admin users from database
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { isAdmin: true },
          ...(adminEmailsFromEnv.length > 0
            ? [{ email: { in: adminEmailsFromEnv } }]
            : []),
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      // Create in-app notifications for all admins
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SYSTEM" as const,
          title: "Rate Limit Exceeded",
          body: `Rate limit exceeded on ${config.name} route from IP: ${identifier}`,
          data: {
            route: config.name,
            identifier,
            limit: config.limit,
          },
        })),
      });
    }

    logger.warn("Rate limit exceeded", { route: config.name, identifier, limit: config.limit });
  } catch (error) {
    logger.error("Failed to log rate limit exceeded", error, { route: config.name, identifier });
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
    ...(result.success ? {} : { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}

// ============================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================

export const rateLimiters = {
  /** Auth routes - strict limits to prevent brute force */
  auth: {
    name: "auth",
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Registration - very strict to prevent spam accounts */
  register: {
    name: "register",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Password reset requests - prevent email flooding */
  forgotPassword: {
    name: "forgot-password",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Email verification resend - prevent email flooding */
  resendVerification: {
    name: "resend-verification",
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Invite token validation - prevent brute force */
  invite: {
    name: "invite",
    limit: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Contact form - prevent spam */
  contact: {
    name: "contact",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Public share viewing - generous limits for viral sharing */
  publicShare: {
    name: "public-share",
    limit: 100,
    windowMs: 60 * 60 * 1000, // 100/hour per IP
  },
  /** Email change requests - prevent abuse */
  emailChange: {
    name: "email-change",
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Product scraping - prevent abuse of external requests */
  scrape: {
    name: "scrape",
    limit: 30,
    windowMs: 60 * 60 * 1000, // 30/hour per IP
  },
  /** API general - catch-all for API abuse */
  apiGeneral: {
    name: "api-general",
    limit: 1000,
    windowMs: 60 * 60 * 1000, // 1000/hour per IP
  },
} as const;
