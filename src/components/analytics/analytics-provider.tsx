"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics-client";

/**
 * Capture UTM parameters from URL on first load and store in sessionStorage.
 * This ensures UTM params are captured immediately and persist across the session.
 */
const captureUtmParams = (searchParams: URLSearchParams | null) => {
  if (typeof window === "undefined" || !searchParams) return;

  const storageKey = "wb_utm_params";

  // Only capture if we don't already have UTM params stored
  if (sessionStorage.getItem(storageKey)) return;

  const utmParams: Record<string, string> = {};

  const source = searchParams.get("utm_source");
  const medium = searchParams.get("utm_medium");
  const campaign = searchParams.get("utm_campaign");
  const content = searchParams.get("utm_content");
  const term = searchParams.get("utm_term");

  if (source) utmParams.utmSource = source;
  if (medium) utmParams.utmMedium = medium;
  if (campaign) utmParams.utmCampaign = campaign;
  if (content) utmParams.utmContent = content;
  if (term) utmParams.utmTerm = term;

  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem(storageKey, JSON.stringify(utmParams));
  }
};

/**
 * Analytics Provider Component
 *
 * Automatically tracks page views on route changes and captures UTM parameters.
 * Add this to your root layout to enable automatic page tracking.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AnalyticsProvider />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mounted = useRef(false);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    // Capture UTM params on first load
    if (!mounted.current && searchParams) {
      captureUtmParams(searchParams);
    }

    // Build full URL with search params
    const url = searchParams?.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (!mounted.current) {
      // Track initial page view
      trackPageView(url);
      mounted.current = true;
      prevUrl.current = url;
    } else if (prevUrl.current !== url) {
      // Track subsequent page views
      trackPageView(url);
      prevUrl.current = url;
    }
  }, [pathname, searchParams]);

  // This component doesn't render anything
  return null;
}
