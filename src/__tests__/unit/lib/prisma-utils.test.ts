import { describe, it, expect, vi } from "vitest";
import { withPrismaRetry, withPrismaRetryAll } from "@/lib/db/prisma-utils";

// Mock the logger to avoid console output in tests
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Prisma Retry Utilities", () => {
  describe("withPrismaRetry", () => {
    it("should return result on successful operation", async () => {
      const result = await withPrismaRetry(async () => "success");
      expect(result).toBe("success");
    });

    it("should retry on transient Accelerate errors", async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error(
            "Accelerate experienced an error communicating with your Query Engine"
          );
        }
        return "success";
      });

      const result = await withPrismaRetry(operation, {
        baseDelayMs: 1, // Fast retry for tests
        context: "test",
      });

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should throw non-transient errors immediately", async () => {
      const operation = vi.fn(async () => {
        throw new Error("Record not found");
      });

      await expect(withPrismaRetry(operation)).rejects.toThrow("Record not found");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should throw after max attempts", async () => {
      const operation = vi.fn(async () => {
        throw new Error("Accelerate experienced an error");
      });

      await expect(
        withPrismaRetry(operation, {
          maxAttempts: 2,
          baseDelayMs: 1,
          context: "test",
        })
      ).rejects.toThrow("Accelerate experienced an error");

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should handle connection pool errors", async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Connection pool exhausted");
        }
        return "recovered";
      });

      const result = await withPrismaRetry(operation, {
        baseDelayMs: 1,
        context: "test",
      });

      expect(result).toBe("recovered");
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe("withPrismaRetryAll", () => {
    it("should return all results on success", async () => {
      const results = await withPrismaRetryAll([
        async () => "first",
        async () => "second",
        async () => "third",
      ]);

      expect(results).toEqual(["first", "second", "third"]);
    });

    it("should retry individual operations on failure", async () => {
      let callCount = 0;
      const results = await withPrismaRetryAll(
        [
          async () => "first",
          async () => {
            callCount++;
            if (callCount < 2) {
              throw new Error("Accelerate experienced an error");
            }
            return "second";
          },
          async () => "third",
        ],
        { baseDelayMs: 1, context: "test" }
      );

      expect(results).toEqual(["first", "second", "third"]);
      expect(callCount).toBe(2);
    });

    it("should propagate non-transient errors", async () => {
      await expect(
        withPrismaRetryAll([
          async () => "first",
          async () => {
            throw new Error("Validation error");
          },
        ])
      ).rejects.toThrow("Validation error");
    });
  });
});
