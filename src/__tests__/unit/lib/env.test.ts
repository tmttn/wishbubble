import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("required variables", () => {
    it("should throw if DATABASE_URL is missing", async () => {
      delete process.env.DATABASE_URL;

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should throw if NEXTAUTH_SECRET is missing in production", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.NEXTAUTH_SECRET;

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });
  });

  describe("optional variables with defaults", () => {
    it("should default LOG_LEVEL to info", async () => {
      process.env.DATABASE_URL = "postgresql://localhost/test";
      process.env.NEXTAUTH_SECRET = "test-secret";
      delete process.env.LOG_LEVEL;

      const { env } = await import("@/lib/env");
      expect(env.LOG_LEVEL).toBe("info");
    });
  });

  describe("validation", () => {
    it("should validate DATABASE_URL is a valid URL", async () => {
      process.env.DATABASE_URL = "not-a-url";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });
  });
});
