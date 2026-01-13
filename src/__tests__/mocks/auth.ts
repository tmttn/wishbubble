import { vi } from "vitest";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  subscriptionTier: "BASIC" | "PLUS" | "COMPLETE";
}

export const mockUser: MockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  subscriptionTier: "BASIC",
};

export const mockPremiumUser: MockUser = {
  ...mockUser,
  id: "premium-user-id",
  subscriptionTier: "PLUS",
};

export const mockAdminUser: MockUser = {
  ...mockUser,
  id: "admin-user-id",
  email: "admin@example.com",
  name: "Admin User",
};

export function mockAuthSession(user: MockUser | null = mockUser) {
  vi.mock("@/lib/auth", () => ({
    auth: vi.fn().mockResolvedValue(
      user ? { user } : null
    ),
  }));
}

export function mockUnauthenticated() {
  mockAuthSession(null);
}
