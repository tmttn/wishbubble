"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BubbleSettingsFormProps {
  bubbleId: string;
  revealGivers: boolean;
}

export function BubbleSettingsForm({
  bubbleId,
  revealGivers: initialRevealGivers,
}: BubbleSettingsFormProps) {
  const t = useTranslations("bubbles.settings");
  const tToast = useTranslations("toasts");
  const router = useRouter();
  const [revealGivers, setRevealGivers] = useState(initialRevealGivers);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    setRevealGivers(checked);

    try {
      const response = await fetch(`/api/bubbles/${bubbleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revealGivers: checked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update setting");
      }

      toast.success(tToast("success.settingsSaved"));
      router.refresh();
    } catch (error) {
      setRevealGivers(!checked); // Revert on error
      toast.error(tToast("error.settingsSaveFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="reveal-givers" className="text-base">
          {t("revealGivers.label")}
        </Label>
        <p className="text-sm text-muted-foreground">
          {t("revealGivers.description")}
        </p>
      </div>
      <Switch
        id="reveal-givers"
        checked={revealGivers}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
    </div>
  );
}
