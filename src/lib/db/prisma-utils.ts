import { logger } from "@/lib/logger";

/**
 * Delay execution for a specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a transient Prisma Accelerate error that should be retried
 *
 * Accelerate-specific transient errors include:
 * - "Accelerate experienced an error communicating with your Query Engine"
 * - Connection pool exhaustion
 * - Temporary network issues
 */
function isTransientAccelerateError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Accelerate-specific transient errors
  const transientPatterns = [
    "accelerate experienced an error",
    "communicating with your query engine",
    "connection pool",
    "connection timed out",
    "connection refused",
    "econnreset",
    "socket hang up",
    "network error",
  ];

  return transientPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponential backoff (default: 100) */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 2000) */
  maxDelayMs?: number;
  /** Context string for logging (default: "prisma operation") */
  context?: string;
}

/**
 * Execute a Prisma operation with automatic retry on transient Accelerate errors
 *
 * Uses exponential backoff with jitter to avoid thundering herd problems.
 *
 * @example
 * ```ts
 * const user = await withPrismaRetry(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   { context: "fetchUser" }
 * );
 * ```
 */
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 100,
    maxDelayMs = 2000,
    context = "prisma operation",
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Only retry on transient Accelerate errors
      if (!isTransientAccelerateError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        logger.error(`${context}: All retry attempts exhausted`, error as Error, {
          attempts: maxAttempts,
        });
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 50; // Add up to 50ms jitter
      const delayMs = Math.min(exponentialDelay + jitter, maxDelayMs);

      logger.warn(`${context}: Transient Accelerate error, retrying`, {
        attempt,
        maxAttempts,
        delayMs: Math.round(delayMs),
        error: error instanceof Error ? error.message : String(error),
      });

      await delay(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Execute multiple Prisma operations in parallel with retry logic for each
 *
 * Similar to Promise.all but wraps each operation with retry logic.
 *
 * @example
 * ```ts
 * const [users, count] = await withPrismaRetryAll([
 *   () => prisma.user.findMany({ take: 10 }),
 *   () => prisma.user.count(),
 * ], { context: "fetchUsersWithCount" });
 * ```
 */
export async function withPrismaRetryAll<T extends readonly unknown[]>(
  operations: { [K in keyof T]: () => Promise<T[K]> },
  options: RetryOptions = {}
): Promise<T> {
  const results = await Promise.all(
    operations.map((op, index) =>
      withPrismaRetry(op, {
        ...options,
        context: options.context
          ? `${options.context}[${index}]`
          : `operation[${index}]`,
      })
    )
  );
  return results as unknown as T;
}
