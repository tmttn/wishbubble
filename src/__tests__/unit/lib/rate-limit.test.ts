import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimitSync,
  getClientIp,
  rateLimiters,
  type RateLimitConfig,
} from "@/lib/rate-limit";

// Mock the prisma module before importing rate-limit
vi.mock("@/lib/db", () => ({
  prisma: {
    activity: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    notification: {
      createMany: vi.fn(),
    },
  },
}));

// Mock logger to prevent console output during tests
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Rate Limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Note: We can't easily clear the in-memory store between tests
    // This is actually one of the issues we're going to fix
  });

  describe("checkRateLimitSync (in-memory)", () => {
    const testConfig: RateLimitConfig = {
      name: "test-route",
      limit: 3,
      windowMs: 60000, // 1 minute
    };

    it("should allow requests under the limit", () => {
      const identifier = `test-ip-${Date.now()}-1`;

      const result1 = checkRateLimitSync(identifier, testConfig, { logExceeded: false });
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimitSync(identifier, testConfig, { logExceeded: false });
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimitSync(identifier, testConfig, { logExceeded: false });
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests over the limit", () => {
      const identifier = `test-ip-${Date.now()}-2`;

      // Use up the limit
      for (let i = 0; i < testConfig.limit; i++) {
        checkRateLimitSync(identifier, testConfig, { logExceeded: false });
      }

      // This should be blocked
      const result = checkRateLimitSync(identifier, testConfig, { logExceeded: false });
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return correct limit in result", () => {
      const identifier = `test-ip-${Date.now()}-3`;

      const result = checkRateLimitSync(identifier, testConfig, { logExceeded: false });
      expect(result.limit).toBe(testConfig.limit);
    });

    it("should return resetAt timestamp", () => {
      const identifier = `test-ip-${Date.now()}-4`;
      const beforeCall = Date.now();

      const result = checkRateLimitSync(identifier, testConfig, { logExceeded: false });

      expect(result.resetAt).toBeGreaterThan(beforeCall);
      expect(result.resetAt).toBeLessThanOrEqual(beforeCall + testConfig.windowMs + 100);
    });

    it("should track different identifiers separately", () => {
      const identifier1 = `test-ip-${Date.now()}-5a`;
      const identifier2 = `test-ip-${Date.now()}-5b`;

      // Use up limit for identifier1
      for (let i = 0; i < testConfig.limit; i++) {
        checkRateLimitSync(identifier1, testConfig, { logExceeded: false });
      }

      // identifier2 should still be allowed
      const result = checkRateLimitSync(identifier2, testConfig, { logExceeded: false });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(testConfig.limit - 1);
    });

    it("should track different routes separately", () => {
      const identifier = `test-ip-${Date.now()}-6`;
      const route1Config: RateLimitConfig = {
        name: `route-1-${Date.now()}`,
        limit: 2,
        windowMs: 60000,
      };
      const route2Config: RateLimitConfig = {
        name: `route-2-${Date.now()}`,
        limit: 2,
        windowMs: 60000,
      };

      // Use up limit for route1
      checkRateLimitSync(identifier, route1Config, { logExceeded: false });
      checkRateLimitSync(identifier, route1Config, { logExceeded: false });
      const blockedResult = checkRateLimitSync(identifier, route1Config, { logExceeded: false });
      expect(blockedResult.success).toBe(false);

      // route2 should still be allowed
      const allowedResult = checkRateLimitSync(identifier, route2Config, { logExceeded: false });
      expect(allowedResult.success).toBe(true);
    });

    it("should mark first exceeded attempt and track notification state", () => {
      const identifier = `test-ip-${Date.now()}-7`;
      const config: RateLimitConfig = {
        name: `first-exceeded-${Date.now()}`,
        limit: 1,
        windowMs: 60000,
      };

      // First request - allowed
      checkRateLimitSync(identifier, config, { logExceeded: true });

      // Second request - first exceeded (with logging enabled, this sets notifiedAt)
      const firstExceeded = checkRateLimitSync(identifier, config, { logExceeded: true });
      expect(firstExceeded.success).toBe(false);
      expect(firstExceeded.firstExceeded).toBe(true);

      // Third request - not first exceeded (notifiedAt was set in previous call)
      const secondExceeded = checkRateLimitSync(identifier, config, { logExceeded: true });
      expect(secondExceeded.success).toBe(false);
      expect(secondExceeded.firstExceeded).toBe(false);
    });

    it("should always report firstExceeded=true when logExceeded is disabled", () => {
      // This tests current behavior: without logging, notifiedAt is never set,
      // so firstExceeded always returns true. This is expected behavior since
      // there's no state change when logging is disabled.
      const identifier = `test-ip-${Date.now()}-8`;
      const config: RateLimitConfig = {
        name: `no-log-exceeded-${Date.now()}`,
        limit: 1,
        windowMs: 60000,
      };

      checkRateLimitSync(identifier, config, { logExceeded: false });

      const firstExceeded = checkRateLimitSync(identifier, config, { logExceeded: false });
      expect(firstExceeded.firstExceeded).toBe(true);

      // Without logging, firstExceeded stays true (no notification tracking)
      const secondExceeded = checkRateLimitSync(identifier, config, { logExceeded: false });
      expect(secondExceeded.firstExceeded).toBe(true);
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-real-ip": "192.168.1.2",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.2");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "192.168.1.2",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should return 'unknown' when no IP headers present", () => {
      const request = new Request("https://example.com");

      const ip = getClientIp(request);
      expect(ip).toBe("unknown");
    });

    it("should trim whitespace from IP", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-real-ip": "  192.168.1.1  ",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });
  });

  describe("rateLimiters presets", () => {
    it("should have auth limiter configured correctly", () => {
      expect(rateLimiters.auth).toBeDefined();
      expect(rateLimiters.auth.name).toBe("auth");
      expect(rateLimiters.auth.limit).toBe(10);
      expect(rateLimiters.auth.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it("should have register limiter configured correctly", () => {
      expect(rateLimiters.register).toBeDefined();
      expect(rateLimiters.register.name).toBe("register");
      expect(rateLimiters.register.limit).toBe(5);
    });

    it("should have forgotPassword limiter configured correctly", () => {
      expect(rateLimiters.forgotPassword).toBeDefined();
      expect(rateLimiters.forgotPassword.limit).toBe(5);
    });

    it("should have contact limiter configured correctly", () => {
      expect(rateLimiters.contact).toBeDefined();
      expect(rateLimiters.contact.limit).toBe(5);
    });

    it("should have publicShare limiter with generous limits", () => {
      expect(rateLimiters.publicShare).toBeDefined();
      expect(rateLimiters.publicShare.limit).toBe(100);
    });
  });
});
