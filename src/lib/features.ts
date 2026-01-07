/**
 * Feature Flags Utility
 *
 * Supports two approaches:
 * 1. Static flags (BETA_FEATURES) - fast, no DB query, good for development
 * 2. Database flags - dynamic, can be toggled at runtime, supports user targeting
 */

import { prisma } from "@/lib/db";

// ============================================================================
// Static Feature Flags (for simple, fast checks)
// ============================================================================

export type FeatureValue = boolean | "beta";

export const BETA_FEATURES: Record<string, FeatureValue> = {
  // Add new beta features here
  // Example: chatReactions: "beta",
};

export type BetaFeature = keyof typeof BETA_FEATURES;

interface UserContext {
  isBetaTester?: boolean;
}

/**
 * Check if a static feature is enabled for a given user (sync)
 *
 * @param feature - The feature key to check
 * @param user - Optional user context with beta tester status
 * @returns Whether the feature is enabled
 */
export function isStaticFeatureEnabled(
  feature: string,
  user?: UserContext | null
): boolean {
  const value = BETA_FEATURES[feature];

  if (value === undefined) return false;
  if (value === true) return true;
  if (value === false) return false;
  if (value === "beta") return user?.isBetaTester ?? false;

  return false;
}

/**
 * Get all enabled static features for a user
 */
export function getEnabledStaticFeatures(
  user?: UserContext | null
): Record<string, boolean> {
  const features: Record<string, boolean> = {};

  for (const key of Object.keys(BETA_FEATURES)) {
    features[key] = isStaticFeatureEnabled(key, user);
  }

  return features;
}

/**
 * Get list of beta-only features
 */
export function getBetaOnlyFeatures(): string[] {
  return Object.keys(BETA_FEATURES).filter(
    (key) => BETA_FEATURES[key] === "beta"
  );
}

// ============================================================================
// Database Feature Flags (for dynamic, runtime-configurable flags)
// ============================================================================

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
 * Check if a database feature flag is enabled (async)
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
 * Get multiple database feature flags at once (more efficient)
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
 * Create a feature flag checker from cached flag data
 * Useful for client components that receive flags from server
 */
export function createFeatureFlagChecker(
  flags: Record<string, boolean>
): (key: string) => boolean {
  return (key: string) => flags[key] ?? false;
}
