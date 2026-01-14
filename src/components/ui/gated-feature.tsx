"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasTierAccess, type SubscriptionTier } from "@/lib/tier-utils";
import { TierBadge } from "./tier-badge";
import { trackEvent } from "@/lib/analytics-client";

export interface GatedFeatureProps {
  /** Feature name for analytics tracking */
  feature: string;
  /** Minimum tier required to use this feature */
  requiredTier: Exclude<SubscriptionTier, "BASIC">;
  /** User's current subscription tier */
  currentTier: SubscriptionTier;
  /** The interactive element to gate (button, switch, etc.) */
  children: React.ReactElement;
  /** Whether to show the tier badge when gated. Default: true */
  showBadge?: boolean;
  /** Custom label for the feature in upgrade messages */
  featureLabel?: string;
  /** Additional class name for the wrapper */
  className?: string;
}

export function GatedFeature({
  feature,
  requiredTier,
  currentTier,
  children,
  showBadge = true,
  featureLabel,
  className,
}: GatedFeatureProps) {
  const router = useRouter();
  const t = useTranslations("plans.gated");

  const isGated = !hasTierAccess(currentTier, requiredTier);

  const handleGatedClick = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      if (!isGated) return;

      // Prevent the default action
      e.preventDefault();
      e.stopPropagation();

      // Track the upgrade prompt
      trackEvent({
        category: "conversion",
        action: "gated_feature_click",
        label: feature,
      });

      // Show upgrade toast
      const tierName = requiredTier === "PLUS" ? "Plus" : "Complete";
      const label = featureLabel || feature;

      toast(t("upgradeToUnlock", { feature: label, tier: tierName }), {
        icon: <Crown className="h-4 w-4 text-amber-500" />,
        action: {
          label: t("upgradeCta"),
          onClick: () => router.push("/pricing"),
        },
      });
    },
    [isGated, feature, featureLabel, requiredTier, router, t]
  );

  // If not gated, render children normally
  if (!isGated) {
    return <>{children}</>;
  }

  // Clone children with disabled prop and wrap with click handler
  // Type assertion needed because children could be any element
  const disabledChild = React.cloneElement(
    children as React.ReactElement<{ disabled?: boolean; "aria-disabled"?: boolean }>,
    {
      disabled: true,
      "aria-disabled": true,
    }
  );

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      onPointerDownCapture={handleGatedClick}
      onClickCapture={handleGatedClick}
    >
      {disabledChild}
      {showBadge && <TierBadge tier={requiredTier} size="sm" />}
    </span>
  );
}
