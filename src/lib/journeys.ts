/**
 * User Journey Definitions
 *
 * Predefined user flows to track conversion funnels and onboarding progress.
 * Each journey has a sequence of steps that users complete.
 */

export const USER_JOURNEYS = {
  // Visitor to registered user flow
  visitor_to_user: {
    id: "visitor_to_user",
    name: "Visitor to User",
    description: "Tracks the path from landing page to verified user",
    steps: [
      "landing_page",
      "pricing_view",
      "register_start",
      "register_complete",
      "email_verified",
    ],
  },

  // New user onboarding
  onboarding: {
    id: "onboarding",
    name: "New User Onboarding",
    description: "Tracks first-time user setup and engagement",
    steps: [
      "register_complete",
      "first_bubble_created",
      "first_wishlist_created",
      "first_item_added",
      "first_member_invited",
    ],
  },

  // First gift claim journey
  first_claim: {
    id: "first_claim",
    name: "First Gift Claim",
    description: "Tracks the path to claiming a first gift",
    steps: [
      "bubble_joined",
      "wishlist_viewed",
      "item_viewed",
      "item_claimed",
    ],
  },

  // Secret Santa flow
  secret_santa: {
    id: "secret_santa",
    name: "Secret Santa Flow",
    description: "Tracks Secret Santa setup and completion",
    steps: [
      "bubble_created",
      "members_invited",
      "draw_initiated",
      "draw_completed",
      "assignment_viewed",
    ],
  },

  // Free to premium upgrade
  free_to_premium: {
    id: "free_to_premium",
    name: "Upgrade Journey",
    description: "Tracks the path from free to paid subscription",
    steps: [
      "limit_reached",
      "pricing_viewed",
      "plan_selected",
      "checkout_started",
      "payment_completed",
    ],
  },

  // Gift completion flow
  gift_completion: {
    id: "gift_completion",
    name: "Gift Giving Flow",
    description: "Tracks the complete gift-giving cycle",
    steps: [
      "item_claimed",
      "item_purchased",
      "event_completed",
    ],
  },
} as const;

export type JourneyType = keyof typeof USER_JOURNEYS;
export type JourneyStep<T extends JourneyType> = (typeof USER_JOURNEYS)[T]["steps"][number];

/**
 * Get journey definition by type
 */
export function getJourney(type: JourneyType) {
  return USER_JOURNEYS[type];
}

/**
 * Check if a step is valid for a journey
 */
export function isValidStep(journeyType: JourneyType, step: string): boolean {
  const journey = USER_JOURNEYS[journeyType];
  return journey?.steps.includes(step as never) ?? false;
}

/**
 * Get step index in a journey
 */
export function getStepIndex(journeyType: JourneyType, step: string): number {
  const journey = USER_JOURNEYS[journeyType];
  return journey?.steps.indexOf(step as never) ?? -1;
}

/**
 * Check if step is the final step in a journey
 */
export function isFinalStep(journeyType: JourneyType, step: string): boolean {
  const journey = USER_JOURNEYS[journeyType];
  if (!journey) return false;
  return journey.steps[journey.steps.length - 1] === step;
}
