/**
 * Simple in-memory rate limiter for API routes.
 *
 * Note: This works for single-instance deployments. For multi-instance/serverless,
 * consider using Redis or Upstash for distributed rate limiting.
 */

import { prisma } from "@/lib/db";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  notifiedAt?: number; // Track when we last notified admins for this entry
}

// Store rate limit data per route
const rateLimitStores = new Map<string, Map<string, RateLimitEntry>>();

// Clean up expired entries periodically (every 5 minutes)
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

  // Don't prevent process from exiting
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

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
      process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];

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

    console.warn(
      `[Rate Limit] Exceeded on ${config.name} - IP: ${identifier}, Limit: ${config.limit}`
    );
  } catch (error) {
    // Don't throw - this is fire and forget
    console.error("[Rate Limit] Failed to log rate limit exceeded:", error);
  }
}

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

/**
 * Check rate limit for a given identifier (usually IP address or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  options: CheckRateLimitOptions = {}
): RateLimitResult {
  const { userAgent, logExceeded = true } = options;

  startCleanup();

  // Get or create store for this rate limiter
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
    // Check if this is the first time we're exceeding (for logging/notification)
    const firstExceeded = !entry.notifiedAt;

    if (firstExceeded && logExceeded) {
      entry.notifiedAt = now;
      // Fire and forget - don't await
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

// Pre-configured rate limiters for common use cases
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
  /** Contact form - already implemented inline, but available here too */
  contact: {
    name: "contact",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Email change requests - prevent abuse */
  emailChange: {
    name: "email-change",
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;
