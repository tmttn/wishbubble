import { vi } from "vitest";

/**
 * Mock Prisma client for testing
 *
 * Usage in tests:
 * ```ts
 * import { mockPrisma, resetPrismaMocks } from "@/__tests__/mocks/prisma";
 *
 * beforeEach(() => {
 *   resetPrismaMocks();
 * });
 *
 * it("should find user", async () => {
 *   mockPrisma.user.findUnique.mockResolvedValue({ id: "1", email: "test@test.com" });
 *   // ... test code
 * });
 * ```
 */

// Create mock functions for each model
const createModelMock = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
  upsert: vi.fn(),
});

export const mockPrisma = {
  user: createModelMock(),
  account: createModelMock(),
  session: createModelMock(),
  verificationToken: createModelMock(),
  passwordResetToken: createModelMock(),
  impersonationToken: createModelMock(),
  subscription: createModelMock(),
  transaction: createModelMock(),
  coupon: createModelMock(),
  couponRedemption: createModelMock(),
  bubble: createModelMock(),
  bubbleMember: createModelMock(),
  wishlist: createModelMock(),
  bubbleWishlist: createModelMock(),
  wishlistItem: createModelMock(),
  claim: createModelMock(),
  secretSantaDraw: createModelMock(),
  secretSantaExclusion: createModelMock(),
  bubbleAccessLog: createModelMock(),
  invitation: createModelMock(),
  notification: createModelMock(),
  activity: createModelMock(),
  pushSubscription: createModelMock(),
  bubbleMessage: createModelMock(),
  scrapedProduct: createModelMock(),
  announcement: createModelMock(),
  contact: createModelMock(),
  productFeed: createModelMock(),
  giftGuide: createModelMock(),
  systemStats: createModelMock(),
  featureFlag: createModelMock(),
  $transaction: vi.fn((operations) => Promise.all(operations)),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

export const resetPrismaMocks = () => {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    }
  });
};

// Mock the prisma module
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
  createPrismaClient: vi.fn(() => mockPrisma),
  createDirectPrismaClient: vi.fn(() => mockPrisma),
}));
