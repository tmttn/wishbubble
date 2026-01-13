"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

interface LeaveGroupDialogProps {
  bubbleId: string;
  bubbleName: string;
}

export function LeaveGroupDialog({ bubbleId, bubbleName }: LeaveGroupDialogProps) {
  const router = useRouter();
  const t = useTranslations("bubbles.members.confirmLeave");
  const tToasts = useTranslations("toasts");

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLeave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/members/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error?.includes("Owner cannot leave")) {
          toast.error(tToasts("error.ownerCannotLeave"));
        } else {
          throw new Error(data.error || "Failed to leave group");
        }
        return;
      }

      toast.success(tToasts("success.leftGroup"));
      setOpen(false);
      router.push("/bubbles");
    } catch {
      toast.error(tToasts("error.leaveGroupFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t("confirm")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { bubbleName })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
