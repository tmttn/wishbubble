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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteGroupDialogProps {
  bubbleId: string;
  bubbleName: string;
}

export function DeleteGroupDialog({ bubbleId, bubbleName }: DeleteGroupDialogProps) {
  const router = useRouter();
  const t = useTranslations("bubbles.members.confirmDelete");
  const tToasts = useTranslations("toasts");

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === bubbleName;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete group");
      }

      toast.success(tToasts("success.groupDeleted"));
      setOpen(false);
      router.push("/bubbles");
      router.refresh();
    } catch (error) {
      toast.error(tToasts("error.deleteGroupFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setConfirmText("");
    }}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>{t("warning1")}</li>
            <li>{t("warning2")}</li>
            <li>{t("warning3")}</li>
          </ul>
          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              {t("confirmLabel")}{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono select-all">
                {bubbleName}
              </code>
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={bubbleName}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || !canDelete}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
