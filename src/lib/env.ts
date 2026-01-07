import { z } from "zod";

// Check if we're in a build phase (Next.js build)
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// Database URL validation - supports postgresql, mysql, sqlite connection strings
const databaseUrlSchema = z
  .string()
  .min(1, "DATABASE_URL is required")
  .refine(
    (url) => {
      // Match common database URL patterns
      const dbUrlPattern = /^(postgres(ql)?|mysql|sqlite|prisma|prisma+postgres):\/\/.+/i;
      // Or standard URLs (for managed services like Prisma Accelerate)
      const standardUrlPattern = /^https?:\/\/.+/i;
      return dbUrlPattern.test(url) || standardUrlPattern.test(url);
    },
    { message: "DATABASE_URL must be a valid database connection URL" }
  );

// Schema for build time (more lenient)
const buildEnvSchema = z.object({
  // All optional during build
  DATABASE_URL: z.string().optional(),
  DIRECT_DATABASE_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PREMIUM_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PREMIUM_YEARLY: z.string().optional(),
  STRIPE_PRICE_FAMILY_MONTHLY: z.string().optional(),
  STRIPE_PRICE_FAMILY_YEARLY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default("noreply@notifications.wish-bubble.app"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  DB_SSL_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).optional(),
});

// Schema for runtime (strict validation)
const runtimeEnvSchema = z.object({
  // Database
  DATABASE_URL: databaseUrlSchema,
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
  EMAIL_FROM: z.string().email().optional().default("noreply@notifications.wish-bubble.app"),

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

export type Env = z.infer<typeof runtimeEnvSchema>;

function validateEnv(): Env {
  // Use lenient schema during build phase
  const schema = isBuildPhase ? buildEnvSchema : runtimeEnvSchema;
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables:" + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  return parsed.data as Env;
}

export const env = validateEnv();
