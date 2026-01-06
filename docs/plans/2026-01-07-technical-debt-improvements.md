# WishBubble Technical Debt & Quality Improvements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address all technical debt and quality issues identified in the architectural review to improve test coverage, security, error handling, and operational excellence.

**Architecture:** This plan is organized into 8 phases, each addressing a specific category of improvements. Phases can be executed independently but are ordered by priority. Each task follows TDD principles where applicable.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Prisma, Zod, Upstash Redis

---

## Phase 1: Environment Validation (Priority: High, Effort: Low)

### Task 1.1: Create Environment Schema with Zod

**Files:**
- Create: `src/lib/env.ts`
- Test: `src/__tests__/unit/lib/env.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/unit/lib/env.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("required variables", () => {
    it("should throw if DATABASE_URL is missing", async () => {
      delete process.env.DATABASE_URL;

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should throw if NEXTAUTH_SECRET is missing in production", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.NEXTAUTH_SECRET;

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });
  });

  describe("optional variables with defaults", () => {
    it("should default LOG_LEVEL to info", async () => {
      process.env.DATABASE_URL = "postgresql://localhost/test";
      process.env.NEXTAUTH_SECRET = "test-secret";
      delete process.env.LOG_LEVEL;

      const { env } = await import("@/lib/env");
      expect(env.LOG_LEVEL).toBe("info");
    });
  });

  describe("validation", () => {
    it("should validate DATABASE_URL is a valid URL", async () => {
      process.env.DATABASE_URL = "not-a-url";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/__tests__/unit/lib/env.test.ts`
Expected: FAIL with "Cannot find module '@/lib/env'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_DATABASE_URL: z.string().optional(),

  // Auth
  NEXTAUTH_SECRET: z
    .string()
    .min(1, "NEXTAUTH_SECRET is required in production")
    .optional()
    .refine(
      (val) => process.env.NODE_ENV !== "production" || !!val,
      "NEXTAUTH_SECRET is required in production"
    ),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PREMIUM_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PREMIUM_YEARLY: z.string().optional(),
  STRIPE_PRICE_FAMILY_MONTHLY: z.string().optional(),
  STRIPE_PRICE_FAMILY_YEARLY: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional().default("noreply@wishbubble.app"),

  // Redis (Rate Limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().optional(),

  // Admin
  ADMIN_EMAILS: z.string().optional(),

  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Push Notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Vercel
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // SSL
  DB_SSL_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/__tests__/unit/lib/env.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/env.ts src/__tests__/unit/lib/env.test.ts
git commit -m "feat: add Zod environment variable validation

- Validates all required env vars at startup
- Provides type-safe access to environment
- Fails fast with clear error messages"
```

---

### Task 1.2: Integrate Environment Validation into Existing Code

**Files:**
- Modify: `src/lib/db/index.ts`
- Modify: `src/lib/stripe.ts`
- Modify: `src/lib/rate-limit.ts`

**Step 1: Update database client to use validated env**

```typescript
// src/lib/db/index.ts - Replace lines 11-15
import { env } from "@/lib/env";

export function createPrismaClient() {
  return new PrismaClient({
    accelerateUrl: env.DATABASE_URL,
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}
```

**Step 2: Update rate-limit to use validated env**

```typescript
// src/lib/rate-limit.ts - Update isUpstashConfigured function
import { env } from "@/lib/env";

export function isUpstashConfigured(): boolean {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}
```

**Step 3: Run existing tests**

Run: `npm run test:run`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/lib/db/index.ts src/lib/rate-limit.ts
git commit -m "refactor: use validated env vars in db and rate-limit modules"
```

---

## Phase 2: Centralized Error Handling (Priority: Medium, Effort: Low)

### Task 2.1: Create API Error Handler Utility

**Files:**
- Create: `src/lib/api-error.ts`
- Test: `src/__tests__/unit/lib/api-error.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/unit/lib/api-error.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleApiError, ApiError, createErrorResponse } from "@/lib/api-error";

// Mock Prisma error
class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;

  constructor(message: string, code: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = "PrismaClientKnownRequestError";
    this.code = code;
    this.meta = meta;
  }
}

describe("API Error Handler", () => {
  describe("ApiError", () => {
    it("should create an error with status code", () => {
      const error = new ApiError("Not found", 404);
      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
    });

    it("should include details when provided", () => {
      const error = new ApiError("Validation failed", 400, { field: "email" });
      expect(error.details).toEqual({ field: "email" });
    });
  });

  describe("createErrorResponse", () => {
    it("should create a JSON response with correct status", () => {
      const response = createErrorResponse("Something went wrong", 500);
      expect(response.status).toBe(500);
    });

    it("should include error message in body", async () => {
      const response = createErrorResponse("Not found", 404);
      const body = await response.json();
      expect(body.error).toBe("Not found");
    });
  });

  describe("handleApiError", () => {
    it("should handle ApiError instances", () => {
      const error = new ApiError("Custom error", 422, { field: "name" });
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(422);
    });

    it("should handle Prisma unique constraint errors (P2002)", () => {
      const error = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        "P2002",
        { target: ["email"] }
      );
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(409);
    });

    it("should handle Prisma not found errors (P2025)", () => {
      const error = new PrismaClientKnownRequestError(
        "Record not found",
        "P2025"
      );
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(404);
    });

    it("should handle Zod validation errors", async () => {
      const { z } = await import("zod");
      const schema = z.object({ email: z.string().email() });
      const result = schema.safeParse({ email: "invalid" });

      if (!result.success) {
        const response = handleApiError(result.error, "test-route");
        expect(response.status).toBe(400);
      }
    });

    it("should return 500 for unknown errors", () => {
      const error = new Error("Unknown error");
      const response = handleApiError(error, "test-route");

      expect(response.status).toBe(500);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/__tests__/unit/lib/api-error.test.ts`
Expected: FAIL with "Cannot find module '@/lib/api-error'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/api-error.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

/**
 * Custom API Error with status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Common error factories
 */
export const Errors = {
  unauthorized: (message = "Unauthorized") => new ApiError(message, 401),
  forbidden: (message = "Forbidden") => new ApiError(message, 403),
  notFound: (message = "Not found") => new ApiError(message, 404),
  conflict: (message = "Conflict") => new ApiError(message, 409),
  badRequest: (message = "Bad request", details?: unknown) =>
    new ApiError(message, 400, details),
  unprocessable: (message = "Unprocessable entity", details?: unknown) =>
    new ApiError(message, 422, details),
  tooManyRequests: (message = "Too many requests") => new ApiError(message, 429),
  internal: (message = "Internal server error") => new ApiError(message, 500),
};

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Check if error is a Prisma known request error
 */
function isPrismaError(error: unknown): error is { code: string; meta?: Record<string, unknown> } {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * Handle errors in API routes with consistent formatting
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  // Handle our custom ApiError
  if (error instanceof ApiError) {
    logger.warn(`API Error in ${context}: ${error.message}`, {
      statusCode: error.statusCode,
      details: error.details,
    });
    return createErrorResponse(error.message, error.statusCode, error.details);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    logger.warn(`Validation error in ${context}`, {
      issues: error.issues,
    });
    return createErrorResponse("Validation failed", 400, error.issues);
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    switch (error.code) {
      case "P2002": // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || "field";
        return createErrorResponse(
          `A record with this ${field} already exists`,
          409,
          { field }
        );

      case "P2025": // Record not found
        return createErrorResponse("Record not found", 404);

      case "P2003": // Foreign key constraint
        return createErrorResponse("Related record not found", 400);

      case "P2014": // Required relation violation
        return createErrorResponse("Required relation missing", 400);

      default:
        logger.error(`Prisma error in ${context}`, error as Error, {
          code: error.code,
        });
        return createErrorResponse("Database error", 500);
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    logger.error(`Unexpected error in ${context}`, error);
    return createErrorResponse("Internal server error", 500);
  }

  // Handle unknown errors
  logger.error(`Unknown error in ${context}`, undefined, { error });
  return createErrorResponse("Internal server error", 500);
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>,
  context: string
): Promise<T | NextResponse> {
  return handler().catch((error) => handleApiError(error, context));
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/__tests__/unit/lib/api-error.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/api-error.ts src/__tests__/unit/lib/api-error.test.ts
git commit -m "feat: add centralized API error handling utility

- Custom ApiError class with status codes
- Error factories for common cases
- Prisma and Zod error handling
- Consistent error response format"
```

---

### Task 2.2: Update One API Route as Example

**Files:**
- Modify: `src/app/api/bubbles/route.ts`

**Step 1: Refactor bubbles route to use error handler**

```typescript
// src/app/api/bubbles/route.ts - Full replacement
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBubbleSchema } from "@/lib/validators/bubble";
import { nanoid } from "nanoid";
import { handleApiError, Errors } from "@/lib/api-error";

// GET /api/bubbles - Get user's bubbles
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw Errors.unauthorized();
    }

    const bubbles = await prisma.bubbleMember.findMany({
      where: {
        userId: session.user.id,
        leftAt: null,
        bubble: {
          archivedAt: null,
        },
      },
      include: {
        bubble: {
          include: {
            owner: {
              select: { id: true, name: true, avatarUrl: true },
            },
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
            _count: {
              select: { members: true, wishlists: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return NextResponse.json(bubbles.map((m: { bubble: unknown }) => m.bubble));
  } catch (error) {
    return handleApiError(error, "GET /api/bubbles");
  }
}

// POST /api/bubbles - Create a new bubble
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw Errors.unauthorized();
    }

    const body = await request.json();
    const validatedData = createBubbleSchema.parse(body); // Throws ZodError if invalid

    const {
      name,
      description,
      occasionType,
      eventDate,
      budgetMin,
      budgetMax,
      currency,
      isSecretSanta,
      maxMembers,
      allowMemberWishlists,
    } = validatedData;

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Create bubble with owner as member
    const bubble = await prisma.bubble.create({
      data: {
        name,
        description,
        slug,
        occasionType,
        eventDate,
        budgetMin,
        budgetMax,
        currency,
        isSecretSanta,
        maxMembers,
        allowMemberWishlists,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Create activity log for group creation
    await prisma.activity.create({
      data: {
        bubbleId: bubble.id,
        userId: session.user.id,
        type: "GROUP_CREATED",
        metadata: {
          groupName: name,
          occasionType,
          userName: session.user.name,
        },
      },
    });

    return NextResponse.json(bubble, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/bubbles");
  }
}
```

**Step 2: Run the app to verify route still works**

Run: `npm run dev`
Test: Make a request to `/api/bubbles` (manual or via existing app)

**Step 3: Commit**

```bash
git add src/app/api/bubbles/route.ts
git commit -m "refactor: use centralized error handling in bubbles route

Example implementation for other routes to follow"
```

---

## Phase 3: Security Hardening (Priority: High, Effort: Low)

### Task 3.1: Restrict Image Remote Patterns

**Files:**
- Modify: `next.config.ts`

**Step 1: Update image configuration**

```typescript
// next.config.ts - Replace images section (lines 63-70)
images: {
  remotePatterns: [
    // Vercel Blob storage
    {
      protocol: "https",
      hostname: "*.public.blob.vercel-storage.com",
    },
    // Bol.com product images
    {
      protocol: "https",
      hostname: "*.bol.com",
    },
    {
      protocol: "https",
      hostname: "media.s-bol.com",
    },
    // Awin affiliate images
    {
      protocol: "https",
      hostname: "*.awin1.com",
    },
    // Common CDNs for user-submitted URLs
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
    {
      protocol: "https",
      hostname: "*.cloudinary.com",
    },
    {
      protocol: "https",
      hostname: "*.amazonaws.com",
    },
    // Google user avatars (OAuth)
    {
      protocol: "https",
      hostname: "lh3.googleusercontent.com",
    },
    // Gravatar
    {
      protocol: "https",
      hostname: "*.gravatar.com",
    },
  ],
},
```

**Step 2: Build to verify config is valid**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "security: restrict image remote patterns

- Remove wildcard ** hostname pattern
- Whitelist known CDNs and providers
- Prevents potential SSRF via image proxy"
```

---

### Task 3.2: Add Rate Limiting to Missing Endpoints

**Files:**
- Modify: `src/app/api/claims/route.ts`
- Modify: `src/lib/rate-limit.ts`

**Step 1: Add new rate limiter configuration**

```typescript
// src/lib/rate-limit.ts - Add to rateLimiters object (around line 472)
/** Claims - prevent item hoarding */
claims: {
  name: "claims",
  limit: 50,
  windowMs: 60 * 60 * 1000, // 50 claims per hour
},
/** Bubble creation - prevent spam groups */
bubbleCreate: {
  name: "bubble-create",
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 groups per hour
},
/** Wishlist item creation - prevent spam */
wishlistItem: {
  name: "wishlist-item",
  limit: 100,
  windowMs: 60 * 60 * 1000, // 100 items per hour
},
```

**Step 2: Add rate limiting to claims route**

Read the claims route first, then modify the POST handler:

```typescript
// src/app/api/claims/route.ts - Add imports at top
import { checkRateLimit, getClientIp, rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";

// Add at start of POST function, after auth check:
const ip = getClientIp(request);
const rateLimit = await checkRateLimit(ip, rateLimiters.claims);
if (!rateLimit.success) {
  return NextResponse.json(
    { error: "Too many claim requests. Please try again later." },
    { status: 429, headers: getRateLimitHeaders(rateLimit) }
  );
}
```

**Step 3: Run existing tests**

Run: `npm run test:run`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/lib/rate-limit.ts src/app/api/claims/route.ts
git commit -m "security: add rate limiting to claims endpoint

- Prevent item hoarding attacks
- 50 claims per hour per IP"
```

---

### Task 3.3: Validate Stripe Webhook Secret

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

**Step 1: Add webhook secret validation**

```typescript
// src/app/api/webhooks/stripe/route.ts - Replace lines 14-15
import { env } from "@/lib/env";

export async function POST(request: Request) {
  // Fail fast if webhook secret not configured
  if (!env.STRIPE_WEBHOOK_SECRET) {
    logger.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      logger.error("[Stripe Webhook] Missing signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      // ... rest of existing code
```

**Step 2: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "security: validate Stripe webhook secret is configured

Fail fast with clear error instead of empty string fallback"
```

---

## Phase 4: Testing Infrastructure (Priority: Critical, Effort: Medium)

### Task 4.1: Create API Test Utilities

**Files:**
- Create: `src/__tests__/utils/api-test-utils.ts`
- Create: `src/__tests__/mocks/auth.ts`

**Step 1: Create mock auth helper**

```typescript
// src/__tests__/mocks/auth.ts
import { vi } from "vitest";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  subscriptionTier: "FREE" | "PREMIUM" | "FAMILY";
}

export const mockUser: MockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  subscriptionTier: "FREE",
};

export const mockPremiumUser: MockUser = {
  ...mockUser,
  id: "premium-user-id",
  subscriptionTier: "PREMIUM",
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
```

**Step 2: Create API test utilities**

```typescript
// src/__tests__/utils/api-test-utils.ts
import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { body, headers = {}, searchParams = {} } = options;

  const urlObj = new URL(url, "http://localhost:3000");
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers,
    }),
  };

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj.toString(), requestInit);
}

/**
 * Parse JSON response body
 */
export async function parseResponseBody<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert response status and optionally body
 */
export async function assertResponse(
  response: Response,
  expectedStatus: number,
  expectedBody?: Record<string, unknown>
) {
  expect(response.status).toBe(expectedStatus);

  if (expectedBody) {
    const body = await response.json();
    expect(body).toMatchObject(expectedBody);
  }
}
```

**Step 3: Commit**

```bash
git add src/__tests__/utils/api-test-utils.ts src/__tests__/mocks/auth.ts
git commit -m "test: add API test utilities and auth mocks

Foundation for integration testing API routes"
```

---

### Task 4.2: Add Authentication Flow Tests

**Files:**
- Create: `src/__tests__/integration/api/auth.test.ts`

**Step 1: Write auth integration tests**

```typescript
// src/__tests__/integration/api/auth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, assertResponse } from "@/__tests__/utils/api-test-utils";

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
  compare: vi.fn(),
}));

// Import after mocks
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should reject registration with invalid email", async () => {
      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("POST", "/api/auth/register", {
        body: {
          name: "Test User",
          email: "invalid-email",
          password: "Password123",
          confirmPassword: "Password123",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should reject registration with weak password", async () => {
      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("POST", "/api/auth/register", {
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
      } as any);

      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("POST", "/api/auth/register", {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
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
      } as any);

      const { POST } = await import("@/app/api/auth/register/route");

      const request = createMockRequest("POST", "/api/auth/register", {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify**

Run: `npm run test:run -- src/__tests__/integration/api/auth.test.ts`
Expected: PASS (may need adjustments based on actual route implementation)

**Step 3: Commit**

```bash
git add src/__tests__/integration/api/auth.test.ts
git commit -m "test: add authentication API integration tests

- Registration validation tests
- Duplicate email handling
- Password strength validation"
```

---

### Task 4.3: Add Stripe Webhook Tests

**Files:**
- Create: `src/__tests__/integration/api/webhooks/stripe.test.ts`

**Step 1: Write Stripe webhook tests**

```typescript
// src/__tests__/integration/api/webhooks/stripe.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "@/__tests__/utils/api-test-utils";

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

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
  },
}));

describe("Stripe Webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject requests without signature", async () => {
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
```

**Step 2: Run test**

Run: `npm run test:run -- src/__tests__/integration/api/webhooks/stripe.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/integration/api/webhooks/stripe.test.ts
git commit -m "test: add Stripe webhook integration tests

- Signature validation
- Event type handling
- Critical for payment reliability"
```

---

## Phase 5: Database Optimizations (Priority: Medium, Effort: Low)

### Task 5.1: Add Full-Text Search Index Migration

**Files:**
- Create: `prisma/migrations/YYYYMMDDHHMMSS_add_fulltext_search/migration.sql`

**Step 1: Create migration file**

```sql
-- prisma/migrations/manual_add_fulltext_search/migration.sql

-- Add GIN index for full-text search on FeedProduct
CREATE INDEX IF NOT EXISTS "FeedProduct_search_idx"
ON "FeedProduct"
USING GIN (to_tsvector('english', "searchText"));

-- Add partial index for active members (commonly queried)
CREATE INDEX IF NOT EXISTS "BubbleMember_active_idx"
ON "BubbleMember" ("bubbleId")
WHERE "leftAt" IS NULL;

-- Add partial index for active bubbles
CREATE INDEX IF NOT EXISTS "Bubble_active_idx"
ON "Bubble" ("ownerId")
WHERE "archivedAt" IS NULL;

-- Add index for pending email queue items (heavily queried by cron)
CREATE INDEX IF NOT EXISTS "EmailQueue_pending_idx"
ON "EmailQueue" ("status", "scheduledFor")
WHERE "status" = 'PENDING';
```

**Step 2: Apply migration**

Run: `npx prisma migrate dev --name add_fulltext_search`
Or for production: `npx prisma migrate deploy`

**Step 3: Commit**

```bash
git add prisma/migrations/
git commit -m "perf: add database indexes for common query patterns

- Full-text search GIN index for products
- Partial indexes for active members/bubbles
- Email queue pending index"
```

---

### Task 5.2: Add Health Check Database Verification

**Files:**
- Modify: `src/app/api/health/route.ts`

**Step 1: Read current health route and enhance**

```typescript
// src/app/api/health/route.ts - Enhanced version
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isUpstashConfigured } from "@/lib/rate-limit";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: "ok" | "error";
    redis: "ok" | "error" | "not_configured";
  };
  details?: Record<string, unknown>;
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus["checks"] = {
    database: "error",
    redis: "not_configured",
  };
  let overallStatus: HealthStatus["status"] = "healthy";

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    checks.database = "error";
    overallStatus = "unhealthy";
  }

  // Check Redis if configured
  if (isUpstashConfigured()) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.ping();
      checks.redis = "ok";
    } catch (error) {
      checks.redis = "error";
      if (overallStatus === "healthy") {
        overallStatus = "degraded";
      }
    }
  }

  const responseTime = Date.now() - startTime;

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks,
    details: {
      responseTimeMs: responseTime,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  return NextResponse.json(health, {
    status: overallStatus === "unhealthy" ? 503 : 200,
  });
}
```

**Step 2: Test health endpoint**

Run: `npm run dev`
Test: `curl http://localhost:3000/api/health`

**Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: enhance health check with database and redis verification

- Database connectivity check
- Redis connectivity check (if configured)
- Response time measurement
- Degraded status for partial failures"
```

---

## Phase 6: Feature Flags Integration (Priority: Low, Effort: Low)

### Task 6.1: Create Feature Flag Utility

**Files:**
- Create: `src/lib/features.ts`
- Test: `src/__tests__/unit/lib/features.test.ts`

**Step 1: Write failing test**

```typescript
// src/__tests__/unit/lib/features.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    featureFlag: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("Feature Flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isFeatureEnabled", () => {
    it("should return false for non-existent flag", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(null);

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("non_existent_flag");

      expect(result).toBe(false);
    });

    it("should return true for globally enabled flag", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "new_feature",
        enabled: true,
        enabledFor: [],
      } as any);

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("new_feature");

      expect(result).toBe(true);
    });

    it("should return true for user in enabledFor list", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "beta_feature",
        enabled: false,
        enabledFor: ["user-123", "user-456"],
      } as any);

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("beta_feature", "user-123");

      expect(result).toBe(true);
    });

    it("should return false for user not in enabledFor list", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "beta_feature",
        enabled: false,
        enabledFor: ["user-123"],
      } as any);

      const { isFeatureEnabled } = await import("@/lib/features");
      const result = await isFeatureEnabled("beta_feature", "user-999");

      expect(result).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/__tests__/unit/lib/features.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// src/lib/features.ts
import { prisma } from "@/lib/db";

/**
 * Feature flag keys - add new flags here for type safety
 */
export const FeatureFlags = {
  DARK_MODE: "dark_mode",
  NEW_CHAT_UI: "new_chat_ui",
  AI_GIFT_SUGGESTIONS: "ai_gift_suggestions",
  FAMILY_PLAN: "family_plan",
  ADVANCED_ANALYTICS: "advanced_analytics",
} as const;

export type FeatureFlagKey = (typeof FeatureFlags)[keyof typeof FeatureFlags];

/**
 * Check if a feature flag is enabled
 *
 * @param key - The feature flag key to check
 * @param userId - Optional user ID for user-specific flags
 * @returns True if the feature is enabled
 */
export async function isFeatureEnabled(
  key: string,
  userId?: string
): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
      select: {
        enabled: true,
        enabledFor: true,
      },
    });

    if (!flag) {
      return false;
    }

    // If globally enabled, return true
    if (flag.enabled) {
      return true;
    }

    // Check if user is in the enabled list
    if (userId && flag.enabledFor.includes(userId)) {
      return true;
    }

    return false;
  } catch (error) {
    // Fail closed - if we can't check, feature is disabled
    console.error(`Error checking feature flag ${key}:`, error);
    return false;
  }
}

/**
 * Get multiple feature flags at once (more efficient)
 */
export async function getFeatureFlags(
  keys: string[],
  userId?: string
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  // Initialize all to false
  for (const key of keys) {
    results[key] = false;
  }

  try {
    const flags = await prisma.featureFlag.findMany({
      where: { key: { in: keys } },
      select: {
        key: true,
        enabled: true,
        enabledFor: true,
      },
    });

    for (const flag of flags) {
      if (flag.enabled) {
        results[flag.key] = true;
      } else if (userId && flag.enabledFor.includes(userId)) {
        results[flag.key] = true;
      }
    }
  } catch (error) {
    console.error("Error checking feature flags:", error);
  }

  return results;
}

/**
 * React hook-compatible feature flag check (for client components)
 * Returns a function that can be called with cached flag data
 */
export function createFeatureFlagChecker(
  flags: Record<string, boolean>
): (key: string) => boolean {
  return (key: string) => flags[key] ?? false;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/__tests__/unit/lib/features.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/features.ts src/__tests__/unit/lib/features.test.ts
git commit -m "feat: add feature flag utility functions

- isFeatureEnabled for single flag checks
- getFeatureFlags for batch fetching
- User-specific flag overrides
- Type-safe flag key constants"
```

---

## Phase 7: API Response Types (Priority: Low, Effort: Low)

### Task 7.1: Create Shared API Response Types

**Files:**
- Create: `src/types/api.ts`

**Step 1: Create API response types**

```typescript
// src/types/api.ts

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Error response helper
 */
export function errorResponse(error: string, details?: unknown): ApiResponse<never> {
  return { error, details };
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  totalCount: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Common entity types for API responses
 */
export interface UserSummary {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface BubbleSummary {
  id: string;
  name: string;
  slug: string;
  occasionType: string;
  eventDate: string | null;
  memberCount: number;
  isSecretSanta: boolean;
}

export interface WishlistSummary {
  id: string;
  name: string;
  itemCount: number;
  owner: UserSummary;
}

export interface WishlistItemSummary {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  priority: "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM";
  isClaimed: boolean;
}
```

**Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add shared API response types

- Standard response wrappers
- Pagination helpers
- Common entity summaries
- Type-safe API contract"
```

---

## Phase 8: Documentation (Priority: Low, Effort: Low)

### Task 8.1: Update README with Architecture Overview

**Files:**
- Modify: `README.md` (if exists, otherwise skip)

**Step 1: This task is documentation-only and can be done manually based on the analysis report**

The comprehensive analysis has already been provided. Key sections to add:
- Technology stack overview
- Environment variables required
- Testing commands
- Deployment notes

**Step 2: Commit any documentation updates**

```bash
git add README.md
git commit -m "docs: update README with architecture overview"
```

---

## Summary & Execution Order

### Critical (Do First)
1. **Phase 1**: Environment Validation (Tasks 1.1-1.2)
2. **Phase 3**: Security Hardening (Tasks 3.1-3.3)
3. **Phase 4**: Testing Infrastructure (Tasks 4.1-4.3)

### Medium Priority
4. **Phase 2**: Centralized Error Handling (Tasks 2.1-2.2)
5. **Phase 5**: Database Optimizations (Tasks 5.1-5.2)

### Low Priority (Nice to Have)
6. **Phase 6**: Feature Flags Integration (Task 6.1)
7. **Phase 7**: API Response Types (Task 7.1)
8. **Phase 8**: Documentation (Task 8.1)

---

## Estimated Total Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | 2 | 30-45 min |
| Phase 2 | 2 | 30-45 min |
| Phase 3 | 3 | 20-30 min |
| Phase 4 | 3 | 60-90 min |
| Phase 5 | 2 | 20-30 min |
| Phase 6 | 1 | 20-30 min |
| Phase 7 | 1 | 15-20 min |
| Phase 8 | 1 | 15-20 min |
| **Total** | **15** | **3.5-5 hours** |

---

## Post-Implementation Verification

After completing all tasks, run:

```bash
# Run all tests
npm run test:run

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

All should pass before merging to main.
