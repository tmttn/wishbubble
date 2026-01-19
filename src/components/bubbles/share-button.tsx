"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const t = useTypedTranslations("share");

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={variant} size={size} onClick={() => setOpen(true)}>
              <Eye className={label ? "mr-2 h-4 w-4" : "h-4 w-4"} />
              {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("dialog.title")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ShareBubbleDialog
        bubbleId={bubbleId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
