-- Rename SubscriptionTier enum values
-- PostgreSQL approach: Create new enum, migrate data, drop old enum

-- Step 1: Rename old enum temporarily
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";

-- Step 2: Create new enum with updated values
CREATE TYPE "SubscriptionTier" AS ENUM ('BASIC', 'PLUS', 'COMPLETE');

-- Step 3: Update User table
ALTER TABLE "User"
  ALTER COLUMN "subscriptionTier" DROP DEFAULT,
  ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier"
    USING (
      CASE "subscriptionTier"::text
        WHEN 'FREE' THEN 'BASIC'::"SubscriptionTier"
        WHEN 'PREMIUM' THEN 'PLUS'::"SubscriptionTier"
        WHEN 'FAMILY' THEN 'COMPLETE'::"SubscriptionTier"
      END
    ),
  ALTER COLUMN "subscriptionTier" SET DEFAULT 'BASIC'::"SubscriptionTier";

-- Step 4: Update Subscription table
ALTER TABLE "Subscription"
  ALTER COLUMN "tier" DROP DEFAULT,
  ALTER COLUMN "tier" TYPE "SubscriptionTier"
    USING (
      CASE "tier"::text
        WHEN 'FREE' THEN 'BASIC'::"SubscriptionTier"
        WHEN 'PREMIUM' THEN 'PLUS'::"SubscriptionTier"
        WHEN 'FAMILY' THEN 'COMPLETE'::"SubscriptionTier"
      END
    ),
  ALTER COLUMN "tier" SET DEFAULT 'PLUS'::"SubscriptionTier";

-- Step 5: Update Coupon.appliesToTiers array
UPDATE "Coupon" SET "appliesToTiers" =
  array_replace(
    array_replace(
      array_replace("appliesToTiers"::text[], 'FREE', 'BASIC'),
      'PREMIUM', 'PLUS'
    ),
    'FAMILY', 'COMPLETE'
  )::"SubscriptionTier"[]
WHERE "appliesToTiers" IS NOT NULL;

-- Step 6: Update Announcement.targetTiers array
UPDATE "Announcement" SET "targetTiers" =
  array_replace(
    array_replace(
      array_replace("targetTiers"::text[], 'FREE', 'BASIC'),
      'PREMIUM', 'PLUS'
    ),
    'FAMILY', 'COMPLETE'
  )::"SubscriptionTier"[]
WHERE "targetTiers" IS NOT NULL;

-- Step 7: Drop old enum
DROP TYPE "SubscriptionTier_old";
