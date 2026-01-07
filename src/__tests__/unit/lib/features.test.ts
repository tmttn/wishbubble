import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://localhost/test",
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    featureFlag: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("Feature Flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("isFeatureEnabled", () => {
    it("should return false for non-existent flag", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(null);

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("non_existent_flag");

      expect(result).toBe(false);
    });

    it("should return true for globally enabled flag", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "new_feature",
        enabled: true,
        enabledFor: [],
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("new_feature");

      expect(result).toBe(true);
    });

    it("should return true for user in enabledFor list", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "beta_feature",
        enabled: false,
        enabledFor: ["user-123", "user-456"],
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("beta_feature", "user-123");

      expect(result).toBe(true);
    });

    it("should return false for user not in enabledFor list", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "beta_feature",
        enabled: false,
        enabledFor: ["user-123"],
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("beta_feature", "user-999");

      expect(result).toBe(false);
    });

    it("should return false on database error", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("any_feature");

      expect(result).toBe(false);
    });
  });

  describe("getFeatureFlags", () => {
    it("should return multiple flags at once", async () => {
      vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([
        {
          id: "1",
          key: "feature_a",
          enabled: true,
          enabledFor: [],
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          key: "feature_b",
          enabled: false,
          enabledFor: ["user-123"],
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { getFeatureFlags } = await import("@/lib/features");
      const result = await getFeatureFlags(
        ["feature_a", "feature_b", "feature_c"],
        "user-123"
      );

      expect(result).toEqual({
        feature_a: true,
        feature_b: true, // enabled for user-123
        feature_c: false, // not found
      });
    });
  });

  describe("createFeatureFlagChecker", () => {
    it("should return a function that checks flags from cache", async () => {
      const { createFeatureFlagChecker } = await import("@/lib/features");

      const checker = createFeatureFlagChecker({
        feature_a: true,
        feature_b: false,
      });

      expect(checker("feature_a")).toBe(true);
      expect(checker("feature_b")).toBe(false);
      expect(checker("feature_c")).toBe(false); // unknown flags default to false
    });
  });
});
