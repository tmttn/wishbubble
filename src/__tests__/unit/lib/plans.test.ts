import { describe, it, expect, vi, beforeEach } from "vitest";

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
    it("should define FREE tier", () => {
      expect(PLANS.FREE).toBeDefined();
      expect(PLANS.FREE.tier).toBe("FREE");
      expect(PLANS.FREE.name).toBe("Free");
    });

    it("should define PREMIUM tier", () => {
      expect(PLANS.PREMIUM).toBeDefined();
      expect(PLANS.PREMIUM.tier).toBe("PREMIUM");
      expect(PLANS.PREMIUM.name).toBe("Premium");
    });

    it("should define FAMILY tier", () => {
      expect(PLANS.FAMILY).toBeDefined();
      expect(PLANS.FAMILY.tier).toBe("FAMILY");
      expect(PLANS.FAMILY.name).toBe("Family");
    });

    it("FREE tier should have restrictive limits", () => {
      const freeLimits = PLANS.FREE.limits;
      expect(freeLimits.maxOwnedGroups).toBe(2);
      expect(freeLimits.maxMembersPerGroup).toBe(8);
      expect(freeLimits.maxWishlists).toBe(3);
      expect(freeLimits.maxItemsPerWishlist).toBe(4);
      expect(freeLimits.canUseSecretSanta).toBe(false);
    });

    it("PREMIUM tier should have generous limits", () => {
      const premiumLimits = PLANS.PREMIUM.limits;
      expect(premiumLimits.maxOwnedGroups).toBe(10);
      expect(premiumLimits.maxMembersPerGroup).toBe(25);
      expect(premiumLimits.maxWishlists).toBe(-1); // Unlimited
      expect(premiumLimits.maxItemsPerWishlist).toBe(-1); // Unlimited
      expect(premiumLimits.canUseSecretSanta).toBe(true);
    });

    it("FAMILY tier should have highest member limit", () => {
      const familyLimits = PLANS.FAMILY.limits;
      expect(familyLimits.maxMembersPerGroup).toBe(50);
      expect(familyLimits.maxMembersPerGroup).toBeGreaterThan(
        PLANS.PREMIUM.limits.maxMembersPerGroup
      );
    });

    it("FREE tier should have zero pricing", () => {
      expect(PLANS.FREE.pricing.monthly).toBe(0);
      expect(PLANS.FREE.pricing.yearly).toBe(0);
    });

    it("PREMIUM tier should have pricing in cents", () => {
      expect(PLANS.PREMIUM.pricing.monthly).toBe(499); // €4.99
      expect(PLANS.PREMIUM.pricing.yearly).toBe(3999); // €39.99
    });

    it("yearly pricing should be less than 12x monthly", () => {
      const monthlyTotal = PLANS.PREMIUM.pricing.monthly * 12;
      expect(PLANS.PREMIUM.pricing.yearly).toBeLessThan(monthlyTotal);
    });

    it("each tier should have features array", () => {
      Object.values(PLANS).forEach((plan) => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getPlanLimits", () => {
    it("should return FREE limits for FREE tier", () => {
      const limits = getPlanLimits("FREE");
      expect(limits).toEqual(PLANS.FREE.limits);
    });

    it("should return PREMIUM limits for PREMIUM tier", () => {
      const limits = getPlanLimits("PREMIUM");
      expect(limits).toEqual(PLANS.PREMIUM.limits);
    });

    it("should return FAMILY limits for FAMILY tier", () => {
      const limits = getPlanLimits("FAMILY");
      expect(limits).toEqual(PLANS.FAMILY.limits);
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
    it("should return 0 for FREE tier", () => {
      const savings = getYearlySavingsPercent("FREE");
      expect(savings).toBe(0);
    });

    it("should return positive savings for PREMIUM tier", () => {
      const savings = getYearlySavingsPercent("PREMIUM");
      expect(savings).toBeGreaterThan(0);
      expect(savings).toBeLessThan(100);
    });

    it("should return approximately 33% savings for PREMIUM", () => {
      const savings = getYearlySavingsPercent("PREMIUM");
      // €4.99 * 12 = €59.88 yearly if monthly
      // €39.99 actual yearly
      // Savings = (59.88 - 39.99) / 59.88 = ~33%
      expect(savings).toBeGreaterThanOrEqual(30);
      expect(savings).toBeLessThanOrEqual(35);
    });

    it("should return rounded integer", () => {
      const savings = getYearlySavingsPercent("PREMIUM");
      expect(Number.isInteger(savings)).toBe(true);
    });

    it("should return positive savings for FAMILY tier", () => {
      const savings = getYearlySavingsPercent("FAMILY");
      expect(savings).toBeGreaterThan(0);
    });
  });
});
