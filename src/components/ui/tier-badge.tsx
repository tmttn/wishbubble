"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/tier-utils";

const tierBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
  {
    variants: {
      tier: {
        PLUS: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        COMPLETE:
          "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "text-xs px-2 py-0.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface TierBadgeProps
  extends Omit<VariantProps<typeof tierBadgeVariants>, "tier"> {
  tier: Exclude<SubscriptionTier, "BASIC">;
  className?: string;
}

const TIER_LABELS: Record<Exclude<SubscriptionTier, "BASIC">, string> = {
  PLUS: "Plus",
  COMPLETE: "Complete",
};

export function TierBadge({ tier, size, className }: TierBadgeProps) {
  return (
    <span className={cn(tierBadgeVariants({ tier, size }), className)}>
      {TIER_LABELS[tier]}
    </span>
  );
}
