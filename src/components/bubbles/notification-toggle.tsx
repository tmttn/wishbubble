"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NotificationToggleProps {
  bubbleId: string;
  initialNotifyActivity: boolean;
  enabledTooltip: string;
  disabledTooltip: string;
  enabledMessage: string;
  disabledMessage: string;
}

export function NotificationToggle({
  bubbleId,
  initialNotifyActivity,
  enabledTooltip,
  disabledTooltip,
  enabledMessage,
  disabledMessage,
}: NotificationToggleProps) {
  const [notifyActivity, setNotifyActivity] = useState(initialNotifyActivity);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyActivity: !notifyActivity }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification settings");
      }

      const newValue = !notifyActivity;
      setNotifyActivity(newValue);
      toast.success(newValue ? enabledMessage : disabledMessage);
    } catch {
      toast.error("Failed to update notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            disabled={isLoading}
            className={!notifyActivity ? "text-muted-foreground" : ""}
          >
            {notifyActivity ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{notifyActivity ? enabledTooltip : disabledTooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
