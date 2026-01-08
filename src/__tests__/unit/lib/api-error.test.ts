import { describe, it, expect } from "vitest";
import { handleApiError, ApiError, createErrorResponse } from "@/lib/api-error";

// Mock Prisma error
class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;

  constructor(message: string, code: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = "PrismaClientKnownRequestError";
    this.code = code;
    this.meta = meta;
  }
}

describe("API Error Handler", () => {
  describe("ApiError", () => {
    it("should create an error with status code", () => {
      const error = new ApiError("Not found", 404);
      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
    });

    it("should include details when provided", () => {
      const error = new ApiError("Validation failed", 400, { field: "email" });
      expect(error.details).toEqual({ field: "email" });
    });
  });

  describe("createErrorResponse", () => {
    it("should create a JSON response with correct status", () => {
      const response = createErrorResponse("Something went wrong", 500);
      expect(response.status).toBe(500);
    });

    it("should include error message in body", async () => {
      const response = createErrorResponse("Not found", 404);
      const body = await response.json();
      expect(body.error).toBe("Not found");
    });
  });

  describe("handleApiError", () => {
    it("should handle ApiError instances", () => {
      const error = new ApiError("Custom error", 422, { field: "name" });
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(422);
    });

    it("should handle Prisma unique constraint errors (P2002)", () => {
      const error = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        "P2002",
        { target: ["email"] }
      );
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(409);
    });

    it("should handle Prisma not found errors (P2025)", () => {
      const error = new PrismaClientKnownRequestError(
        "Record not found",
        "P2025"
      );
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(404);
    });

    it("should handle Zod validation errors", async () => {
      const { z } = await import("zod");
      const schema = z.object({ email: z.string().email() });
      const result = schema.safeParse({ email: "invalid" });

      if (!result.success) {
        const response = handleApiError(result.error, "test-route");
        expect(response.status).toBe(400);
      }
    });

    it("should return 500 for unknown errors", () => {
      const error = new Error("Unknown error");
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(500);
    });

    it("should handle transient Accelerate errors with 503 status", async () => {
      const error = new Error(
        "Accelerate experienced an error communicating with your Query Engine."
      );
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error).toContain("Temporary database connection issue");
    });

    it("should handle connection pool errors with 503 status", async () => {
      const error = new Error("Connection pool exhausted");
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(503);
    });
  });
});
