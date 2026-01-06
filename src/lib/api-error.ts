import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

/**
 * Custom API Error with status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Common error factories
 */
export const Errors = {
  unauthorized: (message = "Unauthorized") => new ApiError(message, 401),
  forbidden: (message = "Forbidden") => new ApiError(message, 403),
  notFound: (message = "Not found") => new ApiError(message, 404),
  conflict: (message = "Conflict") => new ApiError(message, 409),
  badRequest: (message = "Bad request", details?: unknown) =>
    new ApiError(message, 400, details),
  unprocessable: (message = "Unprocessable entity", details?: unknown) =>
    new ApiError(message, 422, details),
  tooManyRequests: (message = "Too many requests") => new ApiError(message, 429),
  internal: (message = "Internal server error") => new ApiError(message, 500),
};

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  details?: unknown
): NextResponse {
  const body: { error: string; details?: unknown } = { error };
  if (details) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Check if error is a Prisma known request error
 */
function isPrismaError(error: unknown): error is { code: string; meta?: Record<string, unknown> } {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * Handle errors in API routes with consistent formatting
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  // Handle our custom ApiError
  if (error instanceof ApiError) {
    logger.warn(`API Error in ${context}: ${error.message}`, {
      statusCode: error.statusCode,
      details: error.details,
    });
    return createErrorResponse(error.message, error.statusCode, error.details);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    logger.warn(`Validation error in ${context}`, {
      issues: error.issues,
    });
    return createErrorResponse("Validation failed", 400, error.issues);
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    switch (error.code) {
      case "P2002": // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || "field";
        return createErrorResponse(
          `A record with this ${field} already exists`,
          409,
          { field }
        );

      case "P2025": // Record not found
        return createErrorResponse("Record not found", 404);

      case "P2003": // Foreign key constraint
        return createErrorResponse("Related record not found", 400);

      case "P2014": // Required relation violation
        return createErrorResponse("Required relation missing", 400);

      default:
        logger.error(`Prisma error in ${context}`, error as unknown as Error, {
          code: error.code,
        });
        return createErrorResponse("Database error", 500);
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    logger.error(`Unexpected error in ${context}`, error);
    return createErrorResponse("Internal server error", 500);
  }

  // Handle unknown errors
  logger.error(`Unknown error in ${context}`, undefined, { error });
  return createErrorResponse("Internal server error", 500);
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>,
  context: string
): Promise<T | NextResponse> {
  return handler().catch((error) => handleApiError(error, context));
}
