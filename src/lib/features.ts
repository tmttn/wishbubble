/**
 * Feature Flags Utility
 *
 * Simple feature flag system for beta testing and gradual rollouts.
 * Features can be:
 * - true: enabled for everyone
 * - false: disabled for everyone
 * - "beta": enabled only for beta testers
 */

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
 * Check if a feature is enabled for a given user
 *
 * @param feature - The feature key to check
 * @param user - Optional user context with beta tester status
 * @returns Whether the feature is enabled
 *
 * @example
 * ```ts
 * // In a server component or API route
 * const user = await getCurrentUser();
 * if (isFeatureEnabled("chatReactions", user)) {
 *   // Show chat reactions UI
 * }
 * ```
 */
export function isFeatureEnabled(
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
 * Get all enabled features for a user
 *
 * @param user - Optional user context with beta tester status
 * @returns Record of feature keys to enabled status
 */
export function getEnabledFeatures(
  user?: UserContext | null
): Record<string, boolean> {
  const features: Record<string, boolean> = {};

  for (const key of Object.keys(BETA_FEATURES)) {
    features[key] = isFeatureEnabled(key, user);
  }

  return features;
}

/**
 * Get list of beta-only features
 *
 * @returns Array of feature keys that are beta-only
 */
export function getBetaOnlyFeatures(): string[] {
  return Object.keys(BETA_FEATURES).filter(
    (key) => BETA_FEATURES[key] === "beta"
  );
}
