import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "@/__tests__/utils/api-test-utils";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma - include all methods used by the route
vi.mock("@/lib/db", () => ({
  prisma: {
    bubbleMember: { findMany: vi.fn() },
    bubble: { create: vi.fn() },
    activity: { create: vi.fn() },
  },
}));

// Mock nanoid for predictable slugs
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("abc123"),
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

describe("Bubbles API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/bubbles", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const { GET } = await import("@/app/api/bubbles/route");
      const response = await GET();

      expect(response.status).toBe(401);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Unauthorized");
    });

    it("should return user bubbles when authenticated", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const mockBubbles = [
        {
          bubble: {
            id: "bubble-1",
            name: "Test Bubble",
            slug: "test-bubble-abc123",
            owner: { id: "user-123", name: "Test User", avatarUrl: null },
            members: [],
            _count: { members: 1, wishlists: 0 },
          },
        },
      ];
      vi.mocked(prisma.bubbleMember.findMany).mockResolvedValue(mockBubbles as never);

      const { GET } = await import("@/app/api/bubbles/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const body = await parseResponse<unknown[]>(response);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(mockBubbles[0].bubble);
      expect(prisma.bubbleMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-123",
            leftAt: null,
          }),
        })
      );
    });
  });

  describe("POST /api/bubbles", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const { POST } = await import("@/app/api/bubbles/route");
      const request = createMockRequest("/api/bubbles", {
        method: "POST",
        body: {
          name: "Test Bubble",
          occasionType: "CHRISTMAS",
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

      const { POST } = await import("@/app/api/bubbles/route");
      const request = createMockRequest("/api/bubbles", {
        method: "POST",
        body: {
          name: "", // Invalid: empty name
          occasionType: "CHRISTMAS",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Validation failed");
    });

    it("should return 400 for invalid data (name too short)", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const { POST } = await import("@/app/api/bubbles/route");
      const request = createMockRequest("/api/bubbles", {
        method: "POST",
        body: {
          name: "A", // Invalid: name too short (min 2 chars)
          occasionType: "CHRISTMAS",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Validation failed");
    });

    it("should return 400 for missing occasion type", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const { POST } = await import("@/app/api/bubbles/route");
      const request = createMockRequest("/api/bubbles", {
        method: "POST",
        body: {
          name: "Test Bubble",
          // Missing occasionType
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await parseResponse<{ error: string }>(response);
      expect(body.error).toBe("Validation failed");
    });

    it("should create bubble with valid data and return 201", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const mockCreatedBubble = {
        id: "bubble-new",
        name: "Family Christmas",
        slug: "family-christmas-abc123",
        description: null,
        occasionType: "CHRISTMAS",
        eventDate: null,
        budgetMin: null,
        budgetMax: null,
        currency: "EUR",
        isSecretSanta: false,
        maxMembers: 10,
        allowMemberWishlists: true,
        ownerId: "user-123",
        owner: { id: "user-123", name: "Test User", avatarUrl: null },
        members: [
          {
            user: { id: "user-123", name: "Test User", avatarUrl: null },
          },
        ],
      };
      vi.mocked(prisma.bubble.create).mockResolvedValue(mockCreatedBubble as never);
      vi.mocked(prisma.activity.create).mockResolvedValue({} as never);

      const { POST } = await import("@/app/api/bubbles/route");
      const request = createMockRequest("/api/bubbles", {
        method: "POST",
        body: {
          name: "Family Christmas",
          occasionType: "CHRISTMAS",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponse<typeof mockCreatedBubble>(response);
      expect(body.id).toBe("bubble-new");
      expect(body.name).toBe("Family Christmas");
      expect(body.slug).toBe("family-christmas-abc123");

      // Verify bubble was created with correct data
      expect(prisma.bubble.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Family Christmas",
            occasionType: "CHRISTMAS",
            ownerId: "user-123",
            members: expect.objectContaining({
              create: expect.objectContaining({
                userId: "user-123",
                role: "OWNER",
              }),
            }),
          }),
        })
      );

      // Verify activity was logged
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bubbleId: "bubble-new",
            userId: "user-123",
            type: "GROUP_CREATED",
          }),
        })
      );
    });

    it("should create bubble with all optional fields", async () => {
      const mockUser = { id: "user-123", name: "Test User", email: "test@example.com" };
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as never);

      const eventDate = new Date("2024-12-25");
      const mockCreatedBubble = {
        id: "bubble-new",
        name: "Secret Santa Party",
        slug: "secret-santa-party-abc123",
        description: "Annual office party",
        occasionType: "CHRISTMAS",
        eventDate,
        budgetMin: 20,
        budgetMax: 50,
        currency: "USD",
        isSecretSanta: true,
        maxMembers: 20,
        allowMemberWishlists: false,
        ownerId: "user-123",
        owner: { id: "user-123", name: "Test User", avatarUrl: null },
        members: [],
      };
      vi.mocked(prisma.bubble.create).mockResolvedValue(mockCreatedBubble as never);
      vi.mocked(prisma.activity.create).mockResolvedValue({} as never);

      const { POST } = await import("@/app/api/bubbles/route");
      const request = createMockRequest("/api/bubbles", {
        method: "POST",
        body: {
          name: "Secret Santa Party",
          description: "Annual office party",
          occasionType: "CHRISTMAS",
          eventDate: "2024-12-25",
          budgetMin: 20,
          budgetMax: 50,
          currency: "USD",
          isSecretSanta: true,
          maxMembers: 20,
          allowMemberWishlists: false,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await parseResponse<typeof mockCreatedBubble>(response);
      expect(body.name).toBe("Secret Santa Party");
      expect(body.description).toBe("Annual office party");
      expect(body.isSecretSanta).toBe(true);
      expect(body.budgetMin).toBe(20);
      expect(body.budgetMax).toBe(50);
    });
  });
});
