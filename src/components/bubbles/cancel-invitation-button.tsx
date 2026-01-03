"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface CancelInvitationButtonProps {
  bubbleId: string;
  invitationId: string;
  email: string;
}

export function CancelInvitationButton({
  bubbleId,
  invitationId,
  email,
}: CancelInvitationButtonProps) {
  const router = useRouter();
  const t = useTranslations("bubbles.members");
  const tToasts = useTranslations("toasts");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/bubbles/${bubbleId}/invite?invitationId=${invitationId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel invitation");
      }

      toast.success(tToasts("success.invitationCancelled"));
      router.refresh();
    } catch {
      toast.error(tToasts("error.cancelInvitationFailed"));
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("actions.cancelInvitation")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("confirmCancelInvitation.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmCancelInvitation.description", { email })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("confirmCancelInvitation.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirmCancelInvitation.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
