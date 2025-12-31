"use client";

import { useState, useEffect } from "react";
import { GiftSummaryModal } from "./gift-summary-modal";

interface GiftSummaryItem {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  url: string | null;
  status: "CLAIMED" | "PURCHASED";
  claimedBy: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  recipient: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface PostEventTriggerProps {
  bubbleId: string;
  bubbleName: string;
  eventDate: Date;
  isEventPassed: boolean;
  currentUserId: string;
}

export function PostEventTrigger({
  bubbleId,
  bubbleName,
  eventDate,
  isEventPassed,
  currentUserId,
}: PostEventTriggerProps) {
  const [showModal, setShowModal] = useState(false);
  const [gifts, setGifts] = useState<GiftSummaryItem[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once and only if event has passed
    if (!isEventPassed || hasChecked) return;

    const checkAndShowSummary = async () => {
      // Check if user has already seen the summary for this bubble
      const seenKey = `gift-summary-seen-${bubbleId}`;
      const hasSeen = localStorage.getItem(seenKey);

      if (hasSeen) {
        setHasChecked(true);
        return;
      }

      // Fetch gift summary data
      try {
        const response = await fetch(`/api/bubbles/${bubbleId}/gift-summary`);
        if (response.ok) {
          const data = await response.json();
          if (data.gifts && data.gifts.length > 0) {
            setGifts(data.gifts);
            setShowModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch gift summary:", error);
      }

      setHasChecked(true);
    };

    checkAndShowSummary();
  }, [bubbleId, isEventPassed, hasChecked]);

  const handleClose = () => {
    setShowModal(false);
    // Mark as seen in localStorage
    localStorage.setItem(`gift-summary-seen-${bubbleId}`, "true");
  };

  if (!showModal || gifts.length === 0) {
    return null;
  }

  return (
    <GiftSummaryModal
      isOpen={showModal}
      onClose={handleClose}
      bubbleName={bubbleName}
      eventDate={eventDate}
      gifts={gifts}
      currentUserId={currentUserId}
    />
  );
}
