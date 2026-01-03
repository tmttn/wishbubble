"use client";

import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <WifiOff className="w-24 h-24 mx-auto text-muted-foreground/50" />
        </div>
        <h1 className="text-4xl font-bold mb-4">You&apos;re Offline</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          It looks like you&apos;ve lost your internet connection. Please check
          your connection and try again.
        </p>
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        <p className="mt-12 text-sm text-muted-foreground">
          Some features may still be available while offline.
        </p>
      </div>
    </div>
  );
}
