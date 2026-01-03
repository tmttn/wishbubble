"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics-client";

/**
 * Analytics Provider Component
 *
 * Automatically tracks page views on route changes.
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
