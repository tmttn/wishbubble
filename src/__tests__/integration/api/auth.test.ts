import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "@/__tests__/utils/api-test-utils";

// Mock the env module before importing route
vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://localhost/test",
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    ADMIN_EMAILS: undefined,
  },
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    wishlist: {
      create: vi.fn(),
    },
    wishlistItem: {
      createMany: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}));

// Mock auth helpers
vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}));

// Mock email
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock rate limit
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, resetAt: Date.now() + 3600000 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimiters: {
    register: { name: "register", limit: 5, windowMs: 3600000 },
  },
}));

// Mock i18n
vi.mock("@/lib/i18n-server", () => ({
  getDefaultWishlistName: vi.fn().mockResolvedValue("My Wishlist"),
  getLocaleFromHeader: vi.fn().mockReturnValue("en"),
  normalizeLocale: vi.fn().mockReturnValue("en"),
}));

// Mock cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { prisma } from "@/lib/db";

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should reject registration with invalid email", async () => {
      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Test User",
          email: "invalid-email",
          password: "Password123!",
          confirmPassword: "Password123!",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should reject registration with weak password", async () => {
      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "weak",
          confirmPassword: "weak",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should reject registration if email already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "existing-user",
        email: "test@example.com",
      } as never);

      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });

    it("should create user with valid registration data", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-user-id",
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
      } as never);
      vi.mocked(prisma.wishlist.create).mockResolvedValue({
        id: "wishlist-id",
        userId: "new-user-id",
        name: "My Wishlist",
        isDefault: true,
      } as never);
      vi.mocked(prisma.verificationToken.create).mockResolvedValue({
        identifier: "test@example.com",
        token: "test-token",
        expires: new Date(),
      } as never);

      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
