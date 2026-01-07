# WishBubble

A collaborative wishlist application for groups, featuring gift bubbles, secret Santa, and family sharing.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL with Prisma ORM (Prisma Accelerate for connection pooling)
- **Authentication**: NextAuth.js with credentials and OAuth providers
- **Payments**: Stripe for subscriptions
- **Caching/Rate Limiting**: Upstash Redis
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **Testing**: Vitest
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) Upstash Redis for rate limiting

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/wishbubble"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Development

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── bubbles/       # Group/bubble management
│   │   ├── health/        # Health check endpoint
│   │   └── webhooks/      # Stripe webhooks
│   └── (routes)/          # Page routes
├── components/            # React components
├── lib/                   # Shared utilities
│   ├── api-error.ts      # Centralized API error handling
│   ├── auth.ts           # Authentication helpers
│   ├── db/               # Database client
│   ├── env.ts            # Environment validation (Zod)
│   ├── features.ts       # Feature flags
│   ├── rate-limit.ts     # Rate limiting utilities
│   └── stripe/           # Stripe integration
├── types/                # TypeScript types
│   └── api.ts            # Shared API response types
└── __tests__/            # Test files
    ├── integration/      # Integration tests
    ├── unit/             # Unit tests
    ├── mocks/            # Test mocks
    └── utils/            # Test utilities
```

## Testing

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run specific test file
npm test -- src/__tests__/unit/lib/env.test.ts
```

## Key Features

- **Environment Validation**: All environment variables are validated at startup using Zod
- **Centralized Error Handling**: Consistent API error responses with proper status codes
- **Rate Limiting**: Configurable rate limits per endpoint using Upstash Redis
- **Feature Flags**: Support for both static and database-backed feature flags
- **Health Checks**: `/api/health` endpoint with database and Redis connectivity checks

## API Conventions

All API responses follow a consistent structure:

```typescript
// Success
{ data: T }

// Error
{ error: string, details?: unknown }

// Paginated
{
  data: T[],
  pagination: {
    page: number,
    pageSize: number,
    totalCount: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  }
}
```

## Deployment

The app is designed for Vercel deployment:

```bash
# Build for production
npm run build

# The build runs TypeScript checks and Next.js optimization
```

For database migrations in production:
```bash
npx prisma migrate deploy
```

## License

Private - All rights reserved
