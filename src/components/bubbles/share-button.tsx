"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareBubbleDialog } from "./share-bubble-dialog";

interface ShareButtonProps {
  bubbleId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function ShareButton({
  bubbleId,
  variant = "outline",
  size = "icon",
  label,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Share2 className={label ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        {label}
      </Button>
      <ShareBubbleDialog
        bubbleId={bubbleId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
