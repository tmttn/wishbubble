# Pricing Tier Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename pricing tiers from FREE/PREMIUM/FAMILY to BASIC/PLUS/COMPLETE with new B2C features for the Complete tier.

**Architecture:** The changes follow a bottom-up approach: Prisma schema enum → plans.ts definitions → translation files → UI components. The COMPLETE tier gets new feature flags in PlanLimits interface. Existing database records with FREE/PREMIUM enum values must be migrated.

**Tech Stack:** Prisma ORM, Next.js, TypeScript, Stripe, i18n with en.json/nl.json

---

## Task 1: Update Prisma Schema Enum

**Files:**
- Modify: `prisma/schema.prisma:86-90`

**Step 1: Update the SubscriptionTier enum**

Change from:
```prisma
enum SubscriptionTier {
  FREE
  PREMIUM
  FAMILY
}
```

To:
```prisma
enum SubscriptionTier {
  BASIC
  PLUS
  COMPLETE
}
```

**Step 2: Update default value references**

Search for `@default(FREE)` and `@default(PREMIUM)` in schema and update:
- User.subscriptionTier: `@default(BASIC)`
- Subscription.tier: `@default(PLUS)`

**Step 3: Commit schema changes**

```bash
git add prisma/schema.prisma
git commit -m "feat: rename subscription tier enum values in Prisma schema

- FREE → BASIC
- PREMIUM → PLUS
- FAMILY → COMPLETE"
```

---

## Task 2: Create Database Migration

**Files:**
- Create: `prisma/migrations/[timestamp]_rename_subscription_tiers/migration.sql`

**Step 1: Generate migration with raw SQL**

Since Prisma doesn't support enum value renaming directly, create a manual migration:

```bash
mkdir -p prisma/migrations/20260113000000_rename_subscription_tiers
```

**Step 2: Write migration SQL**

Create `prisma/migrations/20260113000000_rename_subscription_tiers/migration.sql`:

```sql
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
```

**Step 3: Run migration**

```bash
npx prisma migrate deploy
```

**Step 4: Generate Prisma client**

```bash
npx prisma generate
```

**Step 5: Commit migration**

```bash
git add prisma/migrations/
git commit -m "feat: add migration for subscription tier rename"
```

---

## Task 3: Update PlanLimits Interface and PLANS Object

**Files:**
- Modify: `src/lib/plans.ts:16-110`

**Step 1: Extend PlanLimits interface with new feature flags**

Update PlanLimits interface (lines 16-23):

```typescript
export interface PlanLimits {
  maxOwnedGroups: number;
  maxMembersPerGroup: number;
  maxWishlists: number;
  maxItemsPerWishlist: number;
  canUseSecretSanta: boolean;
  trialDays: number;
  // Complete tier features
  canUsePublicWishlists: boolean;
  canUsePriceAlerts: boolean;
  canUseGiftHistory: boolean;
  canUseRecurringEvents: boolean;
  canUseWishlistCollaboration: boolean;
  canUseBudgetInsights: boolean;
  canUseScheduledDraws: boolean;
  canExportWishlists: boolean;
  canUseMultipleWishlistsPerGroup: boolean;
}
```

**Step 2: Update PLANS object with new tier names and limits**

Replace the entire PLANS object:

```typescript
export const PLANS: Record<SubscriptionTier, PlanDefinition> = {
  BASIC: {
    tier: "BASIC",
    name: "Basic",
    description: "Perfect for getting started",
    limits: {
      maxOwnedGroups: 2,
      maxMembersPerGroup: 8,
      maxWishlists: 3,
      maxItemsPerWishlist: 4,
      canUseSecretSanta: false,
      trialDays: 0,
      canUsePublicWishlists: false,
      canUsePriceAlerts: false,
      canUseGiftHistory: false,
      canUseRecurringEvents: false,
      canUseWishlistCollaboration: false,
      canUseBudgetInsights: false,
      canUseScheduledDraws: false,
      canExportWishlists: false,
      canUseMultipleWishlistsPerGroup: false,
    },
    pricing: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      "Create up to 2 groups",
      "Up to 8 members per group",
      "3 wishlists with 4 items each",
      "Join unlimited groups",
      "Basic notifications",
    ],
  },
  PLUS: {
    tier: "PLUS",
    name: "Plus",
    description: "For active gift-givers",
    limits: {
      maxOwnedGroups: 10,
      maxMembersPerGroup: 25,
      maxWishlists: -1, // Unlimited
      maxItemsPerWishlist: -1, // Unlimited
      canUseSecretSanta: true,
      trialDays: 14,
      canUsePublicWishlists: false,
      canUsePriceAlerts: false,
      canUseGiftHistory: false,
      canUseRecurringEvents: false,
      canUseWishlistCollaboration: false,
      canUseBudgetInsights: false,
      canUseScheduledDraws: false,
      canExportWishlists: false,
      canUseMultipleWishlistsPerGroup: false,
    },
    pricing: {
      monthly: 499, // €4.99
      yearly: 3999, // €39.99
    },
    features: [
      "Create up to 10 groups",
      "Up to 25 members per group",
      "Unlimited wishlists & items",
      "Secret Santa draw",
      "Early access to new features",
    ],
  },
  COMPLETE: {
    tier: "COMPLETE",
    name: "Complete",
    description: "Everything unlocked",
    limits: {
      maxOwnedGroups: -1, // Unlimited
      maxMembersPerGroup: -1, // Unlimited
      maxWishlists: -1, // Unlimited
      maxItemsPerWishlist: -1, // Unlimited
      canUseSecretSanta: true,
      trialDays: 14,
      canUsePublicWishlists: true,
      canUsePriceAlerts: true,
      canUseGiftHistory: true,
      canUseRecurringEvents: true,
      canUseWishlistCollaboration: true,
      canUseBudgetInsights: true,
      canUseScheduledDraws: true,
      canExportWishlists: true,
      canUseMultipleWishlistsPerGroup: true,
    },
    pricing: {
      monthly: 999, // €9.99
      yearly: 7999, // €79.99
    },
    features: [
      "Unlimited groups & members",
      "Unlimited wishlists & items",
      "Secret Santa draw",
      "Public wishlists",
      "Price drop alerts",
      "Gift history tracking",
      "Recurring events",
      "Wishlist collaboration",
      "Budget insights",
      "Scheduled draws",
      "Export & print wishlists",
      "Multiple wishlists per group",
    ],
  },
};
```

**Step 3: Update STRIPE_PRICES getter**

Update the getStripePrices function:

```typescript
export function getStripePrices() {
  return {
    PLUS: {
      monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_PLUS_YEARLY || "",
    },
    COMPLETE: {
      monthly: process.env.STRIPE_PRICE_COMPLETE_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_COMPLETE_YEARLY || "",
    },
  };
}

// For backwards compatibility
export const STRIPE_PRICES = {
  get PLUS() {
    return getStripePrices().PLUS;
  },
  get COMPLETE() {
    return getStripePrices().COMPLETE;
  },
};
```

**Step 4: Update getUserTier function defaults**

Change line 167 from `return "FREE"` to `return "BASIC"`.

**Step 5: Update limit check functions**

Update `canCreateGroup` function (line 222): `tier === "BASIC"` instead of `tier === "FREE"`.
Update `canAddMember` function (line 271): `tier === "BASIC"` instead of `tier === "FREE"`.
Update `canCreateWishlist` function (line 303): `tier === "BASIC"` instead of `tier === "FREE"`.
Update `canAddItem` function (line 360): `tier === "BASIC"` instead of `tier === "FREE"`.
Update `canUseSecretSanta` function (line 376): `tier === "BASIC"` instead of `tier === "FREE"`.

**Step 6: Add new feature check functions**

Add after `canUseSecretSanta` function:

```typescript
/**
 * Check if user can use public wishlists feature
 */
export async function canUsePublicWishlists(userId: string): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  return {
    allowed: limits.canUsePublicWishlists,
    current: 0,
    limit: limits.canUsePublicWishlists ? 1 : 0,
    limitName: "Public wishlists",
    upgradeRequired: !limits.canUsePublicWishlists && tier !== "COMPLETE",
  };
}

/**
 * Check if user can use price alerts feature
 */
export async function canUsePriceAlerts(userId: string): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  return {
    allowed: limits.canUsePriceAlerts,
    current: 0,
    limit: limits.canUsePriceAlerts ? 1 : 0,
    limitName: "Price alerts",
    upgradeRequired: !limits.canUsePriceAlerts && tier !== "COMPLETE",
  };
}

/**
 * Check if user can use gift history feature
 */
export async function canUseGiftHistory(userId: string): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  return {
    allowed: limits.canUseGiftHistory,
    current: 0,
    limit: limits.canUseGiftHistory ? 1 : 0,
    limitName: "Gift history",
    upgradeRequired: !limits.canUseGiftHistory && tier !== "COMPLETE",
  };
}
```

**Step 7: Commit**

```bash
git add src/lib/plans.ts
git commit -m "feat: update plan definitions with new tier names and Complete features

- BASIC: 2 groups, 8 members, 3 wishlists (4 items each)
- PLUS: 10 groups, 25 members, unlimited wishlists
- COMPLETE: unlimited everything + premium features"
```

---

## Task 4: Update Stripe Integration

**Files:**
- Modify: `src/lib/stripe.ts`

**Step 1: Update createCheckoutSession tier handling**

Find references to "PREMIUM" and "FAMILY" and replace with "PLUS" and "COMPLETE".

**Step 2: Update price ID references**

Change environment variable names:
- `STRIPE_PRICE_PREMIUM_MONTHLY` → `STRIPE_PRICE_PLUS_MONTHLY`
- `STRIPE_PRICE_PREMIUM_YEARLY` → `STRIPE_PRICE_PLUS_YEARLY`
- `STRIPE_PRICE_FAMILY_MONTHLY` → `STRIPE_PRICE_COMPLETE_MONTHLY`
- `STRIPE_PRICE_FAMILY_YEARLY` → `STRIPE_PRICE_COMPLETE_YEARLY`

**Step 3: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: update Stripe integration for new tier names"
```

---

## Task 5: Update Billing Checkout API

**Files:**
- Modify: `src/app/api/billing/checkout/route.ts`

**Step 1: Update tier validation**

Change validation from `["PREMIUM", "FAMILY"]` to `["PLUS", "COMPLETE"]`.

**Step 2: Commit**

```bash
git add src/app/api/billing/checkout/route.ts
git commit -m "feat: update checkout API for new tier names"
```

---

## Task 6: Update Translation Files

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/nl.json`

**Step 1: Update English translations**

In `messages/en.json`, update the pricing page section:

Replace all `pricingPage.free.*` with `pricingPage.basic.*`:
- `pricingPage.basic.name`: "Basic"
- `pricingPage.basic.description`: "Perfect for getting started"
- etc.

Replace all `pricingPage.premium.*` with `pricingPage.plus.*`:
- `pricingPage.plus.name`: "Plus"
- `pricingPage.plus.description`: "For active gift-givers"
- etc.

Add new `pricingPage.complete.*` section for Complete tier.

Update other references:
- `bubbles.limits.upgradeToPlus` instead of `upgradeToPremium`
- `admin.users.stats.plus` instead of `premium`

**Step 2: Update Dutch translations**

Apply same changes to `messages/nl.json`.

**Step 3: Commit**

```bash
git add messages/en.json messages/nl.json
git commit -m "feat: update translations for new tier names (Basic, Plus, Complete)"
```

---

## Task 7: Update Pricing Page UI

**Files:**
- Modify: `src/app/(marketing)/pricing/page.tsx`

**Step 1: Update hardcoded PLANS in pricing page**

The pricing page has its own PLANS object - update it to use BASIC/PLUS/COMPLETE with corresponding features.

**Step 2: Add Complete tier to pricing display**

Add the Complete tier card to the pricing comparison.

**Step 3: Update checkout button tier values**

Change from `tier: "PREMIUM"` to `tier: "PLUS"` and add `tier: "COMPLETE"`.

**Step 4: Commit**

```bash
git add src/app/(marketing)/pricing/page.tsx
git commit -m "feat: update pricing page UI with new tier names and Complete tier"
```

---

## Task 8: Update Settings/Billing Page

**Files:**
- Modify: `src/app/(main)/settings/billing/page.tsx`

**Step 1: Update tier references**

Replace "FREE" with "BASIC", "PREMIUM" with "PLUS", "FAMILY" with "COMPLETE" in display logic.

**Step 2: Commit**

```bash
git add src/app/(main)/settings/billing/page.tsx
git commit -m "feat: update billing settings page for new tier names"
```

---

## Task 9: Update Admin Pages

**Files:**
- Modify: `src/app/(admin)/admin/users/page.tsx`
- Modify: `src/components/admin/user-detail-panel.tsx`
- Modify: `src/app/(admin)/admin/announcements/page.tsx`
- Modify: `src/app/(admin)/admin/coupons/page.tsx`

**Step 1: Update user management tier filters**

Change tier filter options from FREE/PREMIUM/FAMILY to BASIC/PLUS/COMPLETE.

**Step 2: Update stats display**

Change "Premium Users" label to "Plus Users" or similar.

**Step 3: Update announcement targeting**

Change default target tiers and dropdown options.

**Step 4: Update coupon tier targeting**

Change tier options in coupon creation/edit forms.

**Step 5: Commit**

```bash
git add src/app/(admin)/admin/users/page.tsx
git add src/components/admin/user-detail-panel.tsx
git add src/app/(admin)/admin/announcements/page.tsx
git add src/app/(admin)/admin/coupons/page.tsx
git commit -m "feat: update admin pages for new tier names"
```

---

## Task 10: Update NextAuth Type Definitions

**Files:**
- Modify: `src/types/next-auth.d.ts`

**Step 1: Verify SubscriptionTier import**

The type definition imports from Prisma, so it should auto-update once Prisma client is regenerated. Verify no hardcoded tier values.

**Step 2: Commit if changes needed**

```bash
git add src/types/next-auth.d.ts
git commit -m "fix: verify NextAuth types work with new tier enum"
```

---

## Task 11: Search and Replace Remaining References

**Step 1: Global search for remaining "FREE" references**

```bash
grep -r '"FREE"' src/ --include="*.ts" --include="*.tsx"
grep -r "'FREE'" src/ --include="*.ts" --include="*.tsx"
grep -r "=== \"FREE\"" src/ --include="*.ts" --include="*.tsx"
```

Replace with "BASIC".

**Step 2: Global search for remaining "PREMIUM" references**

```bash
grep -r '"PREMIUM"' src/ --include="*.ts" --include="*.tsx"
grep -r "'PREMIUM'" src/ --include="*.ts" --include="*.tsx"
```

Replace with "PLUS".

**Step 3: Global search for remaining "FAMILY" references**

```bash
grep -r '"FAMILY"' src/ --include="*.ts" --include="*.tsx"
grep -r "'FAMILY'" src/ --include="*.ts" --include="*.tsx"
```

Replace with "COMPLETE".

**Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "fix: update remaining tier references throughout codebase"
```

---

## Task 12: Update Environment Variables Documentation

**Step 1: Update .env.example**

Add/update Stripe price ID variables:
- `STRIPE_PRICE_PLUS_MONTHLY`
- `STRIPE_PRICE_PLUS_YEARLY`
- `STRIPE_PRICE_COMPLETE_MONTHLY`
- `STRIPE_PRICE_COMPLETE_YEARLY`

Remove old variable names.

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update env example with new Stripe price variable names"
```

---

## Task 13: Run Tests and Build

**Step 1: Run type check**

```bash
npm run type-check
```

Expected: No errors

**Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass

**Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Fix any failures**

If tests or build fail, address the issues.

**Step 5: Final commit**

```bash
git add -A
git commit -m "test: verify all tests pass with new tier structure"
```

---

## Task 14: Create Final Summary Commit

**Step 1: Create summary of changes**

```bash
git log --oneline -15
```

Review all commits made.

**Step 2: Push changes**

```bash
git push origin main
```

---

## Notes

### Environment Variable Mapping
- Old: `STRIPE_PRICE_PREMIUM_MONTHLY` → New: `STRIPE_PRICE_PLUS_MONTHLY`
- Old: `STRIPE_PRICE_PREMIUM_YEARLY` → New: `STRIPE_PRICE_PLUS_YEARLY`
- Old: `STRIPE_PRICE_FAMILY_MONTHLY` → New: `STRIPE_PRICE_COMPLETE_MONTHLY`
- Old: `STRIPE_PRICE_FAMILY_YEARLY` → New: `STRIPE_PRICE_COMPLETE_YEARLY`

### Complete Tier Features (for future implementation)
These features are defined as flags in PlanLimits but their actual implementations are separate tasks:
1. Public wishlists - Share wishlists with non-members
2. Price drop alerts - Notify when item prices decrease
3. Gift history - Track gifts given/received over time
4. Recurring events - Annual birthdays, holidays auto-repeat
5. Wishlist collaboration - Multiple people edit one wishlist
6. Budget insights - Spending analytics and suggestions
7. Scheduled draws - Auto-run Secret Santa at set date/time
8. Export/print - PDF/print-friendly wishlist output
9. Multiple wishlists per group - One person, multiple lists per group
