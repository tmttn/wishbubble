"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Save, Clock, Calendar, Mail } from "lucide-react";
import { toast } from "sonner";

interface OwnerDigestSettingsProps {
  settings: {
    id: string;
    frequency: "DAILY" | "WEEKLY" | "OFF";
    deliveryHour: number;
    weeklyDay: number;
    lastSentAt: string | null;
  };
  ownerEmail: string | null;
}

export function OwnerDigestSettings({
  settings: initialSettings,
  ownerEmail,
}: OwnerDigestSettingsProps) {
  const t = useTranslations("admin.settingsPage.ownerDigest");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/settings/owner-digest", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frequency: settings.frequency,
            deliveryHour: settings.deliveryHour,
            weeklyDay: settings.weeklyDay,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        toast.success(t("saveSuccess"));
        router.refresh();
      } catch {
        toast.error(t("saveError"));
      }
    });
  };

  const handleSendTest = async () => {
    if (!ownerEmail) return;

    setIsSendingTest(true);
    try {
      const response = await fetch("/api/admin/settings/owner-digest/test", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to send");
      }

      toast.success(t("testEmailSuccess"));
    } catch {
      toast.error(t("testEmailError"));
    } finally {
      setIsSendingTest(false);
    }
  };

  const hasChanges =
    settings.frequency !== initialSettings.frequency ||
    settings.deliveryHour !== initialSettings.deliveryHour ||
    settings.weeklyDay !== initialSettings.weeklyDay;

  return (
    <div className="space-y-6">
      {/* Owner Email Display */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {t("ownerEmail")}
        </Label>
        <div className="flex items-center gap-2">
          {ownerEmail ? (
            <Badge variant="secondary" className="font-mono">
              {ownerEmail}
            </Badge>
          ) : (
            <Badge variant="destructive">{t("notConfigured")}</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {t("ownerEmailHint")}
          </span>
        </div>
      </div>

      {/* Frequency Selection */}
      <div className="space-y-2">
        <Label htmlFor="frequency">{t("frequency")}</Label>
        <Select
          value={settings.frequency}
          onValueChange={(value: "DAILY" | "WEEKLY" | "OFF") =>
            setSettings((s) => ({ ...s, frequency: value }))
          }
        >
          <SelectTrigger id="frequency" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OFF">{t("frequencies.OFF")}</SelectItem>
            <SelectItem value="DAILY">{t("frequencies.DAILY")}</SelectItem>
            <SelectItem value="WEEKLY">{t("frequencies.WEEKLY")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Hour */}
      {settings.frequency !== "OFF" && (
        <div className="space-y-2">
          <Label htmlFor="deliveryHour" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("deliveryHour")}
          </Label>
          <Select
            value={String(settings.deliveryHour)}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, deliveryHour: parseInt(value) }))
            }
          >
            <SelectTrigger id="deliveryHour" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {String(i).padStart(2, "0")}:00 UTC
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("deliveryHourHint")}</p>
        </div>
      )}

      {/* Weekly Day Selection */}
      {settings.frequency === "WEEKLY" && (
        <div className="space-y-2">
          <Label htmlFor="weeklyDay" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t("weeklyDay")}
          </Label>
          <Select
            value={String(settings.weeklyDay)}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, weeklyDay: parseInt(value) }))
            }
          >
            <SelectTrigger id="weeklyDay" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {t(`weeklyDays.${day}` as "weeklyDays.0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Last Sent Info */}
      <div className="space-y-2">
        <Label>{t("lastSent")}</Label>
        <p className="text-sm text-muted-foreground">
          {initialSettings.lastSentAt
            ? new Date(initialSettings.lastSentAt).toLocaleString()
            : t("never")}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={isPending || !hasChanges}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
        <Button
          variant="outline"
          onClick={handleSendTest}
          disabled={isSendingTest || !ownerEmail}
        >
          {isSendingTest ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isSendingTest ? t("testEmailSending") : t("testEmail")}
        </Button>
      </div>
    </div>
  );
}
