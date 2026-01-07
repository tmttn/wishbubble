import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "@/__tests__/utils/api-test-utils";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma - include all methods used by the route
vi.mock("@/lib/db", () => ({
  prisma: {
    wishlist: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock plans module
vi.mock("@/lib/plans", () => ({
  canCreateWishlist: vi.fn(),
  getUserTier: vi.fn(),
  getPlanLimits: vi.fn(),
}));

// Mock i18n-server
vi.mock("@/lib/i18n-server", () => ({
  getDefaultWishlistName: vi.fn().mockResolvedValue("My Wishlist"),
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
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateWishlist, getUserTier, getPlanLimits } from "@/lib/plans";
import { getDefaultWishlistName } from "@/lib/i18n-server";

describe("Wishlists API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/wishlists", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const { GET } = await import("@/app/api/wishlists/route");
      const response = await GET();

      expect(response.status).toBe(401);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return user wishlists when authenticated", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const mockWishlists = [
        {
          id: "wishlist-1",
          name: "My Wishlist",
          userId: "user-123",
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { items: 3 },
        },
      ];
      vi.mocked(prisma.wishlist.findMany).mockResolvedValue(mockWishlists as never);
      vi.mocked(canCreateWishlist).mockResolvedValue({
        allowed: true,
        current: 1,
        limit: 5,
        upgradeRequired: false,
      } as never);
      vi.mocked(getUserTier).mockResolvedValue("free" as never);
      vi.mocked(getPlanLimits).mockReturnValue({
        maxWishlists: 5,
        maxItemsPerWishlist: 50,
        maxBubbles: 2,
      } as never);

      const { GET } = await import("@/app/api/wishlists/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const body = await parseResponse<{ wishlists: unknown[]; limits: unknown }>(response);
      expect(body.wishlists).toHaveLength(1);
      expect(body.wishlists[0]).toMatchObject({
        id: "wishlist-1",
        name: "My Wishlist",
        isDefault: true,
      });
      expect(body.limits).toMatchObject({
        current: 1,
        max: 5,
        canCreate: true,
      });
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-123" },
        })
      );
    });

    it("should auto-create default wishlist when user has none", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      // First findMany returns empty array (no wishlists exist)
      vi.mocked(prisma.wishlist.findMany).mockResolvedValue([] as never);

      // Mock user lookup for locale
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        locale: "en",
      } as never);

      // Mock the default wishlist name
      vi.mocked(getDefaultWishlistName).mockResolvedValue("My Wishlist");

      // Mock the auto-created wishlist
      const mockCreatedWishlist = {
        id: "wishlist-auto",
        name: "My Wishlist",
        userId: "user-123",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { items: 0 },
      };
      vi.mocked(prisma.wishlist.create).mockResolvedValue(mockCreatedWishlist as never);

      vi.mocked(canCreateWishlist).mockResolvedValue({
        allowed: true,
        current: 1,
        limit: 5,
        upgradeRequired: false,
      } as never);
      vi.mocked(getUserTier).mockResolvedValue("free" as never);
      vi.mocked(getPlanLimits).mockReturnValue({
        maxWishlists: 5,
        maxItemsPerWishlist: 50,
        maxBubbles: 2,
      } as never);

      const { GET } = await import("@/app/api/wishlists/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const body = await parseResponse<{ wishlists: unknown[]; limits: unknown }>(response);
      expect(body.wishlists).toHaveLength(1);
      expect(body.wishlists[0]).toMatchObject({
        id: "wishlist-auto",
        name: "My Wishlist",
        isDefault: true,
      });

      // Verify auto-create was triggered
      expect(prisma.wishlist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-123",
            name: "My Wishlist",
            isDefault: true,
          }),
        })
      );
      expect(getDefaultWishlistName).toHaveBeenCalled();
    });
  });

  describe("POST /api/wishlists", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const { POST } = await import("@/app/api/wishlists/route");
      const request = createMockRequest("/api/wishlists", {
        method: "POST",
        body: {
          name: "Test Wishlist",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid data (empty name)", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const { POST } = await import("@/app/api/wishlists/route");
      const request = createMockRequest("/api/wishlists", {
        method: "POST",
        body: {
          name: "", // Invalid: empty name
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Invalid input");
    });

    it("should return 400 for invalid data (name too long)", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const { POST } = await import("@/app/api/wishlists/route");
      const request = createMockRequest("/api/wishlists", {
        method: "POST",
        body: {
          name: "A".repeat(101), // Invalid: name too long (max 100 chars)
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Invalid input");
    });

    it("should create wishlist with valid data and return 201", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      vi.mocked(canCreateWishlist).mockResolvedValue({
        allowed: true,
        current: 1,
        limit: 5,
        upgradeRequired: false,
      } as never);

      vi.mocked(prisma.wishlist.count).mockResolvedValue(1 as never);

      const mockCreatedWishlist = {
        id: "wishlist-new",
        name: "Birthday Wishlist",
        userId: "user-123",
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { items: 0 },
      };
      vi.mocked(prisma.wishlist.create).mockResolvedValue(mockCreatedWishlist as never);

      const { POST } = await import("@/app/api/wishlists/route");
      const request = createMockRequest("/api/wishlists", {
        method: "POST",
        body: {
          name: "Birthday Wishlist",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponse<typeof mockCreatedWishlist>(response);
      expect(body.id).toBe("wishlist-new");
      expect(body.name).toBe("Birthday Wishlist");
      expect(body.isDefault).toBe(false);

      // Verify wishlist was created with correct data
      expect(prisma.wishlist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-123",
            name: "Birthday Wishlist",
            isDefault: false,
          }),
        })
      );
    });

    it("should create first wishlist as default", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      vi.mocked(canCreateWishlist).mockResolvedValue({
        allowed: true,
        current: 0,
        limit: 5,
        upgradeRequired: false,
      } as never);

      // No existing wishlists
      vi.mocked(prisma.wishlist.count).mockResolvedValue(0 as never);

      const mockCreatedWishlist = {
        id: "wishlist-first",
        name: "My First Wishlist",
        userId: "user-123",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { items: 0 },
      };
      vi.mocked(prisma.wishlist.create).mockResolvedValue(mockCreatedWishlist as never);

      const { POST } = await import("@/app/api/wishlists/route");
      const request = createMockRequest("/api/wishlists", {
        method: "POST",
        body: {
          name: "My First Wishlist",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponse<typeof mockCreatedWishlist>(response);
      expect(body.isDefault).toBe(true);

      // Verify wishlist was created as default
      expect(prisma.wishlist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDefault: true,
          }),
        })
      );
    });

    it("should return 403 when wishlist limit is reached", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      vi.mocked(canCreateWishlist).mockResolvedValue({
        allowed: false,
        current: 5,
        limit: 5,
        upgradeRequired: true,
      } as never);

      const { POST } = await import("@/app/api/wishlists/route");
      const request = createMockRequest("/api/wishlists", {
        method: "POST",
        body: {
          name: "Another Wishlist",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await parseResponse<{ error: string; upgradeRequired: boolean }>(response);
      expect(body.error).toBe("Wishlist limit reached");
      expect(body.upgradeRequired).toBe(true);
    });
  });
});
