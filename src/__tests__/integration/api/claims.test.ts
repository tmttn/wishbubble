import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "@/__tests__/utils/api-test-utils";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma - include all methods used by the route
vi.mock("@/lib/db", () => ({
  prisma: {
    bubbleMember: { findUnique: vi.fn() },
    wishlistItem: { findUnique: vi.fn() },
    bubble: { findUnique: vi.fn() },
    claim: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn() },
    $transaction: vi.fn(),
  },
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

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimiters: { claims: {} },
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

// Mock notifications
vi.mock("@/lib/notifications", () => ({
  createLocalizedBulkNotifications: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// Reset modules between tests to ensure fresh imports
vi.mock("@/app/api/claims/route", async (importOriginal) => {
  return await importOriginal();
});

describe("Claims API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default rate limit to success
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() });
  });

  describe("POST /api/claims - Claim an item", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 429 when rate limited", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(checkRateLimit).mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() });

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Too many claim requests. Please try again later.");
    });

    it("should return 400 for invalid input (missing itemId)", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Invalid input");
    });

    it("should return 403 when user is not a member of the bubble", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.bubbleMember.findUnique).mockResolvedValue(null);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("You are not a member of this bubble");
    });

    it("should return 403 when member has left the bubble", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.bubbleMember.findUnique).mockResolvedValue({
        bubbleId: "bubble-123",
        userId: "user-123",
        leftAt: new Date(), // User has left
      } as never);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("You are not a member of this bubble");
    });

    it("should return 404 when item does not exist", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.bubbleMember.findUnique).mockResolvedValue({
        bubbleId: "bubble-123",
        userId: "user-123",
        leftAt: null,
      } as never);
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.bubble.findUnique).mockResolvedValue({
        id: "bubble-123",
        name: "Test Bubble",
        members: [],
      } as never);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Item not found");
    });

    it("should return 400 when trying to claim own item", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.bubbleMember.findUnique).mockResolvedValue({
        bubbleId: "bubble-123",
        userId: "user-123",
        leftAt: null,
      } as never);
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
        id: "item-123",
        title: "Test Item",
        quantity: 1,
        wishlist: { userId: "user-123" }, // Same as authenticated user
      } as never);
      vi.mocked(prisma.bubble.findUnique).mockResolvedValue({
        id: "bubble-123",
        name: "Test Bubble",
        members: [],
      } as never);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("You cannot claim your own items");
    });

    it("should return 400 when item is already fully claimed", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.bubbleMember.findUnique).mockResolvedValue({
        bubbleId: "bubble-123",
        userId: "user-123",
        leftAt: null,
      } as never);
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
        id: "item-123",
        title: "Test Item",
        quantity: 1,
        wishlist: { userId: "owner-456" },
      } as never);
      vi.mocked(prisma.bubble.findUnique).mockResolvedValue({
        id: "bubble-123",
        name: "Test Bubble",
        members: [],
      } as never);
      vi.mocked(prisma.claim.findMany).mockResolvedValue([
        { id: "claim-1", userId: "other-user", quantity: 1, status: "CLAIMED" },
      ] as never);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Item is already claimed or not enough quantity available");
    });

    it("should return 400 when user already has a claim on the item", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.bubbleMember.findUnique).mockResolvedValue({
        bubbleId: "bubble-123",
        userId: "user-123",
        leftAt: null,
      } as never);
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
        id: "item-123",
        title: "Test Item",
        quantity: 2,
        wishlist: { userId: "owner-456" },
      } as never);
      vi.mocked(prisma.bubble.findUnique).mockResolvedValue({
        id: "bubble-123",
        name: "Test Bubble",
        members: [],
      } as never);
      vi.mocked(prisma.claim.findMany).mockResolvedValue([
        { id: "claim-1", userId: "user-123", quantity: 1, status: "CLAIMED" }, // User already has a claim
      ] as never);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("You already have a claim on this item");
    });

    it("should successfully create a claim and return 201", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.bubbleMember.findUnique).mockResolvedValue({
        bubbleId: "bubble-123",
        userId: "user-123",
        leftAt: null,
      } as never);
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
        id: "item-123",
        title: "Test Item",
        quantity: 1,
        wishlist: { userId: "owner-456" },
      } as never);
      vi.mocked(prisma.bubble.findUnique).mockResolvedValue({
        id: "bubble-123",
        name: "Test Bubble",
        members: [{ userId: "user-123" }, { userId: "owner-456" }],
      } as never);
      vi.mocked(prisma.claim.findMany).mockResolvedValue([]);

      const mockCreatedClaim = {
        id: "claim-new",
        itemId: "item-123",
        bubbleId: "bubble-123",
        userId: "user-123",
        quantity: 1,
        status: "CLAIMED",
        user: { id: "user-123", name: "Test User", image: null, avatarUrl: null },
      };
      vi.mocked(prisma.$transaction).mockResolvedValue([mockCreatedClaim, {}] as never);

      const { POST } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "POST",
        body: {
          itemId: "item-123",
          bubbleId: "bubble-123",
          quantity: 1,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponse<typeof mockCreatedClaim>(response);
      expect(body.id).toBe("claim-new");
      expect(body.itemId).toBe("item-123");
      expect(body.userId).toBe("user-123");
    });
  });

  describe("DELETE /api/claims - Unclaim an item", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const { DELETE } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(401);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 400 when claim ID is missing", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const { DELETE } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Claim ID is required");
    });

    it("should return 404 when claim does not exist", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.claim.findUnique).mockResolvedValue(null);

      const { DELETE } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Claim not found");
    });

    it("should return 403 when trying to unclaim someone else's claim", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.claim.findUnique).mockResolvedValue({
        id: "claim-123",
        userId: "other-user-456", // Different user
        status: "CLAIMED",
      } as never);

      const { DELETE } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(403);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("You can only unclaim your own claims");
    });

    it("should return 400 when trying to unclaim a purchased item", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.claim.findUnique).mockResolvedValue({
        id: "claim-123",
        userId: "user-123",
        status: "PURCHASED",
      } as never);

      const { DELETE } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Cannot unclaim a purchased item");
    });

    it("should successfully unclaim and return success", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.claim.findUnique).mockResolvedValue({
        id: "claim-123",
        userId: "user-123",
        itemId: "item-123",
        bubbleId: "bubble-123",
        status: "CLAIMED",
      } as never);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never);

      const { DELETE } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const body = await parseResponse<{ success: boolean }>(response);
      expect(body.success).toBe(true);
    });
  });

  describe("PATCH /api/claims - Mark as purchased", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const { PATCH } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "PATCH",
      });

      const response = await PATCH(request);

      expect(response.status).toBe(401);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 400 when claim ID is missing", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const { PATCH } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims", {
        method: "PATCH",
      });

      const response = await PATCH(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Claim ID is required");
    });

    it("should return 404 when claim does not exist", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.claim.findUnique).mockResolvedValue(null);

      const { PATCH } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "PATCH",
      });

      const response = await PATCH(request);

      expect(response.status).toBe(404);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Claim not found");
    });

    it("should return 403 when trying to update someone else's claim", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.claim.findUnique).mockResolvedValue({
        id: "claim-123",
        userId: "other-user-456", // Different user
        status: "CLAIMED",
      } as never);

      const { PATCH } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "PATCH",
      });

      const response = await PATCH(request);

      expect(response.status).toBe(403);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("You can only update your own claims");
    });

    it("should successfully mark as purchased and return updated claim", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);
      vi.mocked(prisma.claim.findUnique).mockResolvedValue({
        id: "claim-123",
        userId: "user-123",
        itemId: "item-123",
        bubbleId: "bubble-123",
        status: "CLAIMED",
      } as never);

      const mockUpdatedClaim = {
        id: "claim-123",
        userId: "user-123",
        itemId: "item-123",
        bubbleId: "bubble-123",
        status: "PURCHASED",
        purchasedAt: new Date(),
      };
      vi.mocked(prisma.$transaction).mockResolvedValue([mockUpdatedClaim, {}] as never);

      const { PATCH } = await import("@/app/api/claims/route");
      const request = createMockRequest("/api/claims?id=claim-123", {
        method: "PATCH",
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      const body = await parseResponse<typeof mockUpdatedClaim>(response);
      expect(body.id).toBe("claim-123");
      expect(body.status).toBe("PURCHASED");
    });
  });
});
