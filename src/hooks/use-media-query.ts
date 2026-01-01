"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Initialize with the actual value to prevent flash/remount on hydration
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    // Update if the value changed (e.g., during SSR hydration mismatch)
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create listener for future changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    media.addEventListener("change", listener);

    // Cleanup
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query, matches]);

  return matches;
}
