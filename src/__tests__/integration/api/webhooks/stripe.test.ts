import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the env module before importing route
vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://localhost/test",
    STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    ADMIN_EMAILS: undefined,
  },
}));

// Mock stripe
const mockConstructEvent = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  },
  handleCheckoutCompleted: vi.fn().mockResolvedValue(undefined),
  handleSubscriptionUpdated: vi.fn().mockResolvedValue(undefined),
  handleSubscriptionDeleted: vi.fn().mockResolvedValue(undefined),
  handlePaymentSucceeded: vi.fn().mockResolvedValue(undefined),
  handlePaymentFailed: vi.fn().mockResolvedValue(undefined),
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

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("Stripe Webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject requests without signature", async () => {
    // Mock headers to return null for stripe-signature
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue(null),
    } as never);

    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const request = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: new Headers({
        "Content-Type": "application/json",
        // No stripe-signature header
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Missing signature");
  });

  it("should reject requests with invalid signature", async () => {
    // Mock headers to return a signature
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue("invalid_signature"),
    } as never);

    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const request = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: new Headers({
        "Content-Type": "application/json",
        "stripe-signature": "invalid_signature",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("should handle checkout.session.completed event", async () => {
    // Mock headers to return a valid signature
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue("valid_signature"),
    } as never);

    const { handleCheckoutCompleted } = await import("@/lib/stripe");

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          customer: "cus_test_123",
        },
      },
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const request = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: new Headers({
        "Content-Type": "application/json",
        "stripe-signature": "valid_signature",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(handleCheckoutCompleted).toHaveBeenCalled();
  });

  it("should handle subscription updated event", async () => {
    // Mock headers to return a valid signature
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue("valid_signature"),
    } as never);

    const { handleSubscriptionUpdated } = await import("@/lib/stripe");

    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_test_123",
          status: "active",
        },
      },
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const request = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: new Headers({
        "Content-Type": "application/json",
        "stripe-signature": "valid_signature",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(handleSubscriptionUpdated).toHaveBeenCalled();
  });
});
