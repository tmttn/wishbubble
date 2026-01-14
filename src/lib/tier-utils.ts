/**
 * Client-safe tier utilities for subscription tier comparison.
 * These functions have NO database dependencies and can be used in client components.
 */

// SubscriptionTier type definition for client components
export type SubscriptionTier = "BASIC" | "PLUS" | "COMPLETE";

/**
 * Numeric tier levels for comparison.
 * Higher number = more features.
 */
export const TIER_LEVELS: Record<SubscriptionTier, number> = {
  BASIC: 0,
  PLUS: 1,
  COMPLETE: 2,
};

/**
 * Check if a user's tier has access to a required tier level.
 * @param currentTier - The user's current subscription tier
 * @param requiredTier - The minimum tier required for the feature
 * @returns true if the user has access
 */
export function hasTierAccess(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return TIER_LEVELS[currentTier] >= TIER_LEVELS[requiredTier];
}

/**
 * Get the tier a user needs to upgrade to for a feature.
 * @param currentTier - The user's current subscription tier
 * @param requiredTier - The minimum tier required for the feature
 * @returns The tier to upgrade to, or null if already has access
 */
export function getUpgradeTier(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): SubscriptionTier | null {
  if (hasTierAccess(currentTier, requiredTier)) return null;
  return requiredTier;
}
