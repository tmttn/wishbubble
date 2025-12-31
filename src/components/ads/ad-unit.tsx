"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  responsive?: boolean;
  className?: string;
}

export function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const { data: session, status } = useSession();
  const isPremium = session?.user?.subscriptionTier === "PREMIUM";

  useEffect(() => {
    // Don't show ads to premium users or if AdSense is not configured
    if (isPremium || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
      return;
    }

    // Wait for session to load before showing ads
    if (status === "loading") {
      return;
    }

    try {
      // Push ad to adsbygoogle queue
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, [isPremium, status]);

  // Don't render anything for premium users
  if (status === "loading") {
    return null;
  }

  if (isPremium) {
    return null;
  }

  // Don't render if AdSense is not configured
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={cn("ad-container overflow-hidden", className)}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
