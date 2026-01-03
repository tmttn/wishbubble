"use client";

import { useEffect } from "react";

interface SerwistProviderProps {
  children: React.ReactNode;
  swUrl: string;
}

export function SerwistProvider({ children, swUrl }: SerwistProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: "/",
        });
        console.log("[SW] Service worker registered with scope:", registration.scope);

        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          console.log("[SW] New service worker installing...");

          newWorker?.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[SW] New content available, refresh to update");
            }
          });
        });
      } catch (error) {
        console.error("[SW] Service worker registration failed:", error);
      }
    };

    registerSW();
  }, [swUrl]);

  return <>{children}</>;
}
