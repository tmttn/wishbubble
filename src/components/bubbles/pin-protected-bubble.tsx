"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PinEntryDialog } from "./pin-entry-dialog";

interface PinProtectedBubbleProps {
  bubbleId: string;
  bubbleName: string;
  isSecretSanta: boolean;
  children: React.ReactNode;
}

export function PinProtectedBubble({
  bubbleId,
  bubbleName,
  isSecretSanta,
  children,
}: PinProtectedBubbleProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [needsPin, setNeedsPin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Only check PIN for Secret Santa bubbles
    if (!isSecretSanta) {
      setIsLoading(false);
      setIsVerified(true);
      return;
    }

    checkPinStatus();
  }, [bubbleId, isSecretSanta]);

  const checkPinStatus = async () => {
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/verify-pin`);
      const data = await response.json();

      if (response.ok) {
        setNeedsPin(data.hasPinProtection && !data.isVerified);
        setIsVerified(!data.hasPinProtection || data.isVerified);
      }
    } catch (error) {
      // If check fails, assume no PIN needed
      setIsVerified(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSuccess = () => {
    setNeedsPin(false);
    setIsVerified(true);
  };

  const handlePinCancel = () => {
    router.push("/bubbles");
  };

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Show content if verified or no PIN needed
  if (isVerified) {
    return <>{children}</>;
  }

  // Show PIN dialog
  return (
    <>
      <div className="min-h-screen bg-background" />
      <PinEntryDialog
        bubbleId={bubbleId}
        bubbleName={bubbleName}
        open={needsPin}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    </>
  );
}
