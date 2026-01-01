"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, Ghost } from "lucide-react";
import Link from "next/link";

const funnyMessages = [
  "This page went to get milk and never came back.",
  "404: Page not found. It's probably off living its best life somewhere.",
  "Oops! This page is playing hide and seek... and winning.",
  "The page you're looking for is in another castle.",
  "This page took an arrow to the knee and retired.",
  "Error 404: Page has left the chat.",
  "This wish didn't come true. The page doesn't exist!",
];

export default function NotFound() {
  const [randomMessage] = useState(
    () => funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
  );

  useEffect(() => {
    // Track 404 hits in Sentry to identify broken links
    Sentry.captureMessage("404 Page Not Found", {
      level: "warning",
      tags: {
        page: "not-found",
        type: "404",
      },
      extra: {
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        referrer: typeof document !== "undefined" ? document.referrer : "unknown",
      },
    });
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <Ghost className="w-24 h-24 mx-auto text-muted-foreground/50 animate-bounce" />
        </div>
        <h1 className="text-8xl font-black text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          {randomMessage}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard">
              <Search className="w-4 h-4" />
              Browse Wishlists
            </Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          If you believe this is a mistake, try refreshing the page or check the URL.
        </p>
      </div>
    </div>
  );
}
