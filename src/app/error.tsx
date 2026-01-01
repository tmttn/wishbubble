"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, Flame } from "lucide-react";

const funnyMessages = [
  "Well, this is awkward... Our code decided to take an unscheduled vacation.",
  "Oops! Our hamsters powering the servers need a coffee break.",
  "Houston, we have a problem. And by Houston, we mean our servers.",
  "Something broke! But hey, at least it wasn't your New Year's resolution.",
  "Error 500: The wish-granting machinery is temporarily out of order.",
  "Our code just pulled a Houdini. We're working on the magic trick.",
  "The server is having an existential crisis. Give it a moment.",
  "Congratulations! You found a bug. Unfortunately, it's not a feature.",
];

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [message] = useState(
    () => funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
  );

  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="mb-8 relative">
          <div className="text-8xl font-black text-destructive/20">500</div>
          <Flame className="w-16 h-16 mx-auto text-destructive absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Something Went Wrong!</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"} className="gap-2">
            <Home className="w-4 h-4" />
            Go home
          </Button>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-muted-foreground">
            Error ID: {error.digest}
            <br />
            <span className="text-muted-foreground/50">
              (Save this if you need to report the issue)
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
