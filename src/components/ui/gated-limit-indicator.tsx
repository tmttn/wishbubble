"use client";

import Link from "next/link";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { hasTierAccess, type SubscriptionTier } from "@/lib/tier-utils";
import { TierBadge } from "./tier-badge";

export interface GatedLimitIndicatorProps {
  /** Current usage count */
  current: number;
  /** Current limit for user's tier */
  limit: number;
  /** Limit with upgraded tier (-1 = unlimited) */
  maxWithUpgrade: number;
  /** Feature name for translation key */
  feature: string;
  /** Tier required to get the upgraded limit */
  upgradeTier: Exclude<SubscriptionTier, "BASIC">;
  /** User's current subscription tier */
  currentTier: SubscriptionTier;
  /** Whether to show upgrade hint when at limit. Default: true */
  showUpgradeHint?: boolean;
  /** Additional class name */
  className?: string;
}

export function GatedLimitIndicator({
  current,
  limit,
  maxWithUpgrade,
  feature,
  upgradeTier,
  currentTier,
  showUpgradeHint = true,
  className,
}: GatedLimitIndicatorProps) {
  const t = useTypedTranslations("plans.gated");

  // Check if user can upgrade (not already at or above the upgrade tier)
  const canUpgrade = !hasTierAccess(currentTier, upgradeTier);
  const isAtLimit = limit !== -1 && current >= limit;
  const isUnlimited = limit === -1;

  // Calculate progress percentage (cap at 100)
  const progressPercent = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);

  // Format the upgrade text
  const upgradeText =
    maxWithUpgrade === -1
      ? t("unlimited")
      : t("getMore", { amount: maxWithUpgrade - limit });

  const tierName = upgradeTier === "PLUS" ? "Plus" : "Complete";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Usage text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {isUnlimited ? (
            // Unlimited - just show current count
            <span>
              {current} {feature}
            </span>
          ) : canUpgrade ? (
            // Show upgrade hint in the label
            t("limitWithUpgrade", {
              current,
              limit,
              upgradeText,
              tier: tierName,
            })
          ) : (
            // Already at max tier, just show usage
            <span>
              {current} / {limit} {feature}
            </span>
          )}
        </span>
        {isAtLimit && canUpgrade && <TierBadge tier={upgradeTier} size="sm" />}
      </div>

      {/* Progress bar (only show if not unlimited) */}
      {!isUnlimited && (
        <Progress
          value={progressPercent}
          className={cn("h-1.5", isAtLimit && "bg-amber-100 dark:bg-amber-950")}
        />
      )}

      {/* Upgrade CTA when at limit */}
      {showUpgradeHint && isAtLimit && canUpgrade && (
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("upgradeToUnlock", { feature, tier: tierName })}
        </Link>
      )}
    </div>
  );
}
