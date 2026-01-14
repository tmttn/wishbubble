"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HomepageCheckoutButtonProps {
  tier: "PLUS" | "COMPLETE";
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function HomepageCheckoutButton({
  tier,
  children,
  className,
  variant = "default",
}: HomepageCheckoutButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    // If not authenticated, redirect to register with callback to pricing
    // (pricing page will handle the checkout after login)
    if (status === "unauthenticated") {
      router.push(`/register?callbackUrl=/pricing?tier=${tier}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          interval: "MONTHLY", // Default to monthly (lower price barrier)
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "Already subscribed") {
        router.push("/settings/billing");
      } else {
        Sentry.captureMessage("Homepage checkout: No checkout URL returned", {
          level: "error",
          extra: { data, tier },
        });
        // Fallback to pricing page if checkout fails
        router.push("/pricing");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "HomepageCheckoutButton", tier },
      });
      // Fallback to pricing page on error
      router.push("/pricing");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={cn("w-full rounded-xl", className)}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
