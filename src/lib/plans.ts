/**
 * Plan definitions and limit enforcement for WishBubble subscriptions.
 *
 * Pricing:
 * - Free: €0
 * - Premium: €4.99/month or €39.99/year (save ~33%)
 */

import { SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/db";

// ============================================
// PLAN DEFINITIONS
// ============================================

export interface PlanLimits {
  maxOwnedGroups: number;
  maxMembersPerGroup: number;
  maxWishlists: number;
  maxItemsPerWishlist: number;
  canUseSecretSanta: boolean;
  trialDays: number;
}

export interface PlanDefinition {
  tier: SubscriptionTier;
  name: string;
  description: string;
  limits: PlanLimits;
  pricing: {
    monthly: number; // In cents
    yearly: number; // In cents
  };
  features: string[];
}

export const PLANS: Record<SubscriptionTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    description: "Perfect for getting started",
    limits: {
      maxOwnedGroups: 2,
      maxMembersPerGroup: 8,
      maxWishlists: 3,
      maxItemsPerWishlist: 4,
      canUseSecretSanta: false,
      trialDays: 0,
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
  PREMIUM: {
    tier: "PREMIUM",
    name: "Premium",
    description: "For active gift-givers",
    limits: {
      maxOwnedGroups: 10,
      maxMembersPerGroup: 25,
      maxWishlists: -1, // Unlimited
      maxItemsPerWishlist: -1, // Unlimited
      canUseSecretSanta: true,
      trialDays: 14,
    },
    pricing: {
      monthly: 499, // €4.99
      yearly: 3999, // €39.99
    },
    features: [
      "Create up to 10 groups",
      "Up to 25 members per group",
      "Unlimited wishlists & items",
      "Secret Santa feature",
      "Priority support",
      "Early access to new features",
    ],
  },
  FAMILY: {
    tier: "FAMILY",
    name: "Family",
    description: "For large families (coming soon)",
    limits: {
      maxOwnedGroups: 10,
      maxMembersPerGroup: 50,
      maxWishlists: -1,
      maxItemsPerWishlist: -1,
      canUseSecretSanta: true,
      trialDays: 14,
    },
    pricing: {
      monthly: 999, // €9.99
      yearly: 7999, // €79.99
    },
    features: [
      "Everything in Premium",
      "Up to 50 members per group",
      "Share with up to 5 family members",
      "Dedicated support",
    ],
  },
};

// Stripe price IDs - use getter to ensure env vars are read at runtime
export function getStripePrices() {
  return {
    PREMIUM: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || "",
    },
    FAMILY: {
      monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_FAMILY_YEARLY || "",
    },
  };
}

// For backwards compatibility
export const STRIPE_PRICES = {
  get PREMIUM() {
    return getStripePrices().PREMIUM;
  },
  get FAMILY() {
    return getStripePrices().FAMILY;
  },
};

// ============================================
// LIMIT CHECKING
// ============================================

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  limitName: string;
  upgradeRequired: boolean;
}

/**
 * Get the effective tier for a user (considering active subscription)
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscription: {
        select: {
          status: true,
          tier: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!user) return "FREE";

  // Check for active subscription
  const subscription = user.subscription;
  if (subscription) {
    const now = new Date();

    // Active or trialing subscription
    if (subscription.status === "ACTIVE" || subscription.status === "TRIALING") {
      // Check if trial has expired
      if (subscription.status === "TRIALING" && subscription.trialEndsAt) {
        if (subscription.trialEndsAt < now) {
          return "FREE";
        }
      }
      return subscription.tier;
    }

    // Past due - still allow access for grace period
    if (subscription.status === "PAST_DUE") {
      return subscription.tier;
    }
  }

  return user.subscriptionTier;
}

/**
 * Get plan limits for a tier
 */
export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return PLANS[tier].limits;
}

/**
 * Check if user can create another group
 */
export async function canCreateGroup(userId: string): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  const currentGroups = await prisma.bubble.count({
    where: {
      ownerId: userId,
      archivedAt: null,
    },
  });

  const allowed = limits.maxOwnedGroups === -1 || currentGroups < limits.maxOwnedGroups;

  return {
    allowed,
    current: currentGroups,
    limit: limits.maxOwnedGroups,
    limitName: "groups",
    upgradeRequired: !allowed && tier === "FREE",
  };
}

/**
 * Check if user can add another member to a group they own
 */
export async function canAddMember(
  userId: string,
  groupId: string
): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  // Check if user owns the group
  const group = await prisma.bubble.findUnique({
    where: { id: groupId },
    select: {
      ownerId: true,
      _count: {
        select: {
          members: {
            where: { leftAt: null },
          },
        },
      },
    },
  });

  if (!group || group.ownerId !== userId) {
    // User doesn't own the group - they can still join
    return {
      allowed: true,
      current: 0,
      limit: limits.maxMembersPerGroup,
      limitName: "members",
      upgradeRequired: false,
    };
  }

  const currentMembers = group._count.members;
  const allowed =
    limits.maxMembersPerGroup === -1 || currentMembers < limits.maxMembersPerGroup;

  return {
    allowed,
    current: currentMembers,
    limit: limits.maxMembersPerGroup,
    limitName: "members per group",
    upgradeRequired: !allowed && tier === "FREE",
  };
}

/**
 * Check if user can create another wishlist
 */
export async function canCreateWishlist(userId: string): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  if (limits.maxWishlists === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      limitName: "wishlists",
      upgradeRequired: false,
    };
  }

  const currentWishlists = await prisma.wishlist.count({
    where: { userId },
  });

  const allowed = currentWishlists < limits.maxWishlists;

  return {
    allowed,
    current: currentWishlists,
    limit: limits.maxWishlists,
    limitName: "wishlists",
    upgradeRequired: !allowed && tier === "FREE",
  };
}

/**
 * Check if user can add another item to a wishlist
 */
export async function canAddItem(
  userId: string,
  wishlistId: string
): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  if (limits.maxItemsPerWishlist === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      limitName: "items",
      upgradeRequired: false,
    };
  }

  // Verify ownership
  const wishlist = await prisma.wishlist.findUnique({
    where: { id: wishlistId },
    select: {
      userId: true,
      _count: {
        select: {
          items: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!wishlist || wishlist.userId !== userId) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      limitName: "items",
      upgradeRequired: false,
    };
  }

  const currentItems = wishlist._count.items;
  const allowed = currentItems < limits.maxItemsPerWishlist;

  return {
    allowed,
    current: currentItems,
    limit: limits.maxItemsPerWishlist,
    limitName: "items per wishlist",
    upgradeRequired: !allowed && tier === "FREE",
  };
}

/**
 * Check if user can use Secret Santa feature
 */
export async function canUseSecretSanta(userId: string): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  return {
    allowed: limits.canUseSecretSanta,
    current: 0,
    limit: limits.canUseSecretSanta ? 1 : 0,
    limitName: "Secret Santa",
    upgradeRequired: !limits.canUseSecretSanta && tier === "FREE",
  };
}

// ============================================
// USAGE STATS
// ============================================

export interface UsageStats {
  tier: SubscriptionTier;
  limits: PlanLimits;
  usage: {
    ownedGroups: number;
    wishlists: number;
    totalItems: number;
  };
}

/**
 * Get usage stats for a user
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);

  const [ownedGroups, wishlists, items] = await Promise.all([
    prisma.bubble.count({
      where: { ownerId: userId, archivedAt: null },
    }),
    prisma.wishlist.count({
      where: { userId },
    }),
    prisma.wishlistItem.count({
      where: { wishlist: { userId }, deletedAt: null },
    }),
  ]);

  return {
    tier,
    limits,
    usage: {
      ownedGroups,
      wishlists,
      totalItems: items,
    },
  };
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format price in cents to display string
 */
export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Calculate yearly savings percentage
 */
export function getYearlySavingsPercent(tier: SubscriptionTier): number {
  const plan = PLANS[tier];
  if (plan.pricing.monthly === 0) return 0;

  const yearlyIfMonthly = plan.pricing.monthly * 12;
  const savings = ((yearlyIfMonthly - plan.pricing.yearly) / yearlyIfMonthly) * 100;
  return Math.round(savings);
}
