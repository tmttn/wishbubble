import { describe, it, expect, vi } from "vitest";

// Mock prisma before importing plans (which imports db)
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    bubble: { count: vi.fn() },
    wishlist: { count: vi.fn() },
    wishlistItem: { count: vi.fn() },
  },
}));

import {
  PLANS,
  getPlanLimits,
  formatPrice,
  getYearlySavingsPercent,
} from "@/lib/plans";

// These tests focus on pure functions that don't need database access
// Database-dependent functions (canCreateGroup, etc.) would need integration tests

describe("Plans", () => {
  describe("PLANS constant", () => {
    it("should define BASIC tier", () => {
      expect(PLANS.BASIC).toBeDefined();
      expect(PLANS.BASIC.tier).toBe("BASIC");
      expect(PLANS.BASIC.name).toBe("Basic");
    });

    it("should define PLUS tier", () => {
      expect(PLANS.PLUS).toBeDefined();
      expect(PLANS.PLUS.tier).toBe("PLUS");
      expect(PLANS.PLUS.name).toBe("Plus");
    });

    it("should define COMPLETE tier", () => {
      expect(PLANS.COMPLETE).toBeDefined();
      expect(PLANS.COMPLETE.tier).toBe("COMPLETE");
      expect(PLANS.COMPLETE.name).toBe("Complete");
    });

    it("BASIC tier should have restrictive limits", () => {
      const basicLimits = PLANS.BASIC.limits;
      expect(basicLimits.maxOwnedGroups).toBe(2);
      expect(basicLimits.maxMembersPerGroup).toBe(8);
      expect(basicLimits.maxWishlists).toBe(3);
      expect(basicLimits.maxItemsPerWishlist).toBe(4);
      expect(basicLimits.canUseSecretSanta).toBe(false);
    });

    it("PLUS tier should have generous limits", () => {
      const plusLimits = PLANS.PLUS.limits;
      expect(plusLimits.maxOwnedGroups).toBe(10);
      expect(plusLimits.maxMembersPerGroup).toBe(25);
      expect(plusLimits.maxWishlists).toBe(-1); // Unlimited
      expect(plusLimits.maxItemsPerWishlist).toBe(-1); // Unlimited
      expect(plusLimits.canUseSecretSanta).toBe(true);
    });

    it("COMPLETE tier should have unlimited members", () => {
      const completeLimits = PLANS.COMPLETE.limits;
      expect(completeLimits.maxMembersPerGroup).toBe(-1); // Unlimited
      expect(completeLimits.maxOwnedGroups).toBe(-1); // Unlimited groups too
    });

    it("BASIC tier should have zero pricing", () => {
      expect(PLANS.BASIC.pricing.monthly).toBe(0);
      expect(PLANS.BASIC.pricing.yearly).toBe(0);
    });

    it("PLUS tier should have pricing in cents", () => {
      expect(PLANS.PLUS.pricing.monthly).toBe(499); // €4.99
      expect(PLANS.PLUS.pricing.yearly).toBe(3999); // €39.99
    });

    it("yearly pricing should be less than 12x monthly", () => {
      const monthlyTotal = PLANS.PLUS.pricing.monthly * 12;
      expect(PLANS.PLUS.pricing.yearly).toBeLessThan(monthlyTotal);
    });

    it("each tier should have features array", () => {
      Object.values(PLANS).forEach((plan) => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getPlanLimits", () => {
    it("should return BASIC limits for BASIC tier", () => {
      const limits = getPlanLimits("BASIC");
      expect(limits).toEqual(PLANS.BASIC.limits);
    });

    it("should return PLUS limits for PLUS tier", () => {
      const limits = getPlanLimits("PLUS");
      expect(limits).toEqual(PLANS.PLUS.limits);
    });

    it("should return COMPLETE limits for COMPLETE tier", () => {
      const limits = getPlanLimits("COMPLETE");
      expect(limits).toEqual(PLANS.COMPLETE.limits);
    });
  });

  describe("formatPrice", () => {
    it("should format price in EUR by default", () => {
      const formatted = formatPrice(499);
      expect(formatted).toMatch(/4[.,]99/); // Account for locale differences
      expect(formatted).toMatch(/€|EUR/);
    });

    it("should format price in specified currency", () => {
      const formatted = formatPrice(999, "USD");
      expect(formatted).toMatch(/9[.,]99/);
      expect(formatted).toMatch(/\$|USD/);
    });

    it("should handle zero correctly", () => {
      const formatted = formatPrice(0);
      expect(formatted).toMatch(/0[.,]00/);
    });

    it("should handle large amounts", () => {
      const formatted = formatPrice(99999);
      expect(formatted).toMatch(/999[.,]99/);
    });

    it("should convert cents to currency units", () => {
      const formatted = formatPrice(100);
      expect(formatted).toMatch(/1[.,]00/);
    });
  });

  describe("getYearlySavingsPercent", () => {
    it("should return 0 for BASIC tier", () => {
      const savings = getYearlySavingsPercent("BASIC");
      expect(savings).toBe(0);
    });

    it("should return positive savings for PLUS tier", () => {
      const savings = getYearlySavingsPercent("PLUS");
      expect(savings).toBeGreaterThan(0);
      expect(savings).toBeLessThan(100);
    });

    it("should return approximately 33% savings for PLUS", () => {
      const savings = getYearlySavingsPercent("PLUS");
      // €4.99 * 12 = €59.88 yearly if monthly
      // €39.99 actual yearly
      // Savings = (59.88 - 39.99) / 59.88 = ~33%
      expect(savings).toBeGreaterThanOrEqual(30);
      expect(savings).toBeLessThanOrEqual(35);
    });

    it("should return rounded integer", () => {
      const savings = getYearlySavingsPercent("PLUS");
      expect(Number.isInteger(savings)).toBe(true);
    });

    it("should return positive savings for COMPLETE tier", () => {
      const savings = getYearlySavingsPercent("COMPLETE");
      expect(savings).toBeGreaterThan(0);
    });
  });
});
