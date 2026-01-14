# Gated Features: Disabled State with Upgrade Badges

**Date:** 2026-01-14
**Status:** Ready for implementation

## Overview

Instead of hiding plan-gated features from free users, we'll show them as disabled with tier badges. This creates upgrade incentive by letting users see what they're missing.

## Components

### 1. TierBadge (`src/components/ui/tier-badge.tsx`)

Simple badge showing the required tier name.

```tsx
interface TierBadgeProps {
  tier: "PLUS" | "COMPLETE";
  size?: "sm" | "md";
  className?: string;
}
```

**Styling:**
- PLUS: `bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300`
- COMPLETE: `bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300`

### 2. GatedFeature (`src/components/ui/gated-feature.tsx`)

Wrapper component for boolean feature gates.

```tsx
interface GatedFeatureProps {
  feature: string;                              // For analytics
  requiredTier: "PLUS" | "COMPLETE";
  currentTier: "BASIC" | "PLUS" | "COMPLETE";
  children: React.ReactElement;
  showBadge?: boolean;                          // Default: true
  badgePosition?: "inline" | "after";           // Default: "after"
  className?: string;
}
```

**Behavior:**
- If `currentTier` >= `requiredTier`: render children normally
- If gated:
  - Clone children with `disabled={true}`
  - Show TierBadge after the element
  - Wrap in click handler that shows upgrade toast

**Toast format:**
```
"[Feature] requires [Tier]. Upgrade →"
```

### 3. GatedLimitIndicator (`src/components/ui/gated-limit-indicator.tsx`)

Shows usage progress with upgrade messaging.

```tsx
interface GatedLimitIndicatorProps {
  current: number;
  limit: number;
  maxWithUpgrade: number;                       // -1 = unlimited
  feature: string;                              // Translation key
  upgradeTier: "PLUS" | "COMPLETE";
  currentTier: "BASIC" | "PLUS" | "COMPLETE";
  showUpgradeHint?: boolean;                    // Default: true
  className?: string;
}
```

**Renders:**
```
Wishlists: 3 of 3 (unlimited with Plus)
[████████████████████]
```

When at limit and `showUpgradeHint`:
```
Wishlists: 3 of 3
[████████████████████]
✨ Get unlimited with Plus → Upgrade
```

## Utility: Tier Comparison

Add to `src/lib/plans.ts`:

```typescript
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  BASIC: 0,
  PLUS: 1,
  COMPLETE: 2,
};

export function hasTierAccess(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return TIER_LEVELS[currentTier] >= TIER_LEVELS[requiredTier];
}

export function getUpgradeTier(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): SubscriptionTier | null {
  if (hasTierAccess(currentTier, requiredTier)) return null;
  return requiredTier;
}
```

## Locations to Update

### Boolean Feature Gates

| Feature | File | Required Tier | Current Behavior |
|---------|------|---------------|------------------|
| Secret Santa toggle | `app/(main)/bubbles/new/new-bubble-form.tsx` | PLUS | Always shown (API blocks) |
| Secret Santa draw | `app/(main)/bubbles/[id]/page.tsx` | PLUS | Only if `isSecretSanta` |
| Price alerts | `components/wishlist/sortable-item.tsx` | COMPLETE | Hidden if no access |
| Share wishlist | `app/(main)/wishlist/page.tsx` | COMPLETE | Hidden if no access |
| Gift history | Navigation/dashboard | COMPLETE | Hidden if no access |

### Numeric Limits

| Limit | File | Basic | Plus | Complete |
|-------|------|-------|------|----------|
| Owned groups | `app/(main)/bubbles/page.tsx` | 2 | 10 | ∞ |
| Members/group | `app/(main)/bubbles/[id]/invite/page.tsx` | 8 | 25 | ∞ |
| Wishlists | `app/(main)/wishlist/page.tsx` | 3 | ∞ | ∞ |
| Items/wishlist | `app/(main)/wishlist/page.tsx` | 4 | ∞ | ∞ |

## Translations

### English (`messages/en.json`)

```json
{
  "plans": {
    "tiers": {
      "plus": "Plus",
      "complete": "Complete"
    },
    "gated": {
      "requiresTier": "Requires {tier}",
      "upgradeToUnlock": "{feature} requires {tier}",
      "upgradeCta": "Upgrade",
      "limitWithUpgrade": "{current} of {limit} ({upgradeText} with {tier})",
      "unlimited": "unlimited",
      "getMore": "Get {amount} more",
      "atLimit": "Limit reached"
    }
  }
}
```

### Dutch (`messages/nl.json`)

```json
{
  "plans": {
    "tiers": {
      "plus": "Plus",
      "complete": "Compleet"
    },
    "gated": {
      "requiresTier": "Vereist {tier}",
      "upgradeToUnlock": "{feature} vereist {tier}",
      "upgradeCta": "Upgraden",
      "limitWithUpgrade": "{current} van {limit} ({upgradeText} met {tier})",
      "unlimited": "onbeperkt",
      "getMore": "Krijg {amount} meer",
      "atLimit": "Limiet bereikt"
    }
  }
}
```

## Implementation Steps

1. **Create utility functions** in `src/lib/plans.ts`
   - Add `hasTierAccess()` and `getUpgradeTier()` functions
   - Add `TIER_LEVELS` constant

2. **Create TierBadge component** (`src/components/ui/tier-badge.tsx`)
   - Simple badge with tier-specific styling
   - Support sm/md sizes

3. **Create GatedFeature component** (`src/components/ui/gated-feature.tsx`)
   - Wrapper that handles disabled state
   - Shows badge and upgrade toast on click
   - Track analytics events

4. **Create GatedLimitIndicator component** (`src/components/ui/gated-limit-indicator.tsx`)
   - Progress bar with current/limit
   - Upgrade hint when at limit
   - Link to pricing page

5. **Add translations** to both `en.json` and `nl.json`

6. **Update boolean feature gates:**
   - `new-bubble-form.tsx`: Wrap Secret Santa toggle
   - `sortable-item.tsx`: Show disabled price alert button with badge
   - `wishlist/page.tsx`: Show disabled share option with badge

7. **Update numeric limit displays:**
   - `wishlist/page.tsx`: Replace existing limit indicators
   - `bubbles/page.tsx`: Add group limit indicator

8. **Test all tiers:**
   - BASIC user sees disabled features with badges
   - PLUS user sees Secret Santa enabled, Complete features disabled
   - COMPLETE user sees everything enabled

## Analytics Events

Track when users interact with gated features:

```typescript
trackEvent({
  category: "conversion",
  action: "gated_feature_click",
  label: feature,  // e.g., "secretSanta", "priceAlerts"
  value: requiredTier === "PLUS" ? 1 : 2,
});
```

## Design Decisions

1. **Toast over modal:** Less intrusive, doesn't block the UI
2. **Badge after element:** Keeps the feature label clean
3. **Progress bar for limits:** Visual representation of usage
4. **Link to /pricing:** Single destination for all upgrades
5. **Disabled state:** Standard HTML disabled, maintains accessibility
