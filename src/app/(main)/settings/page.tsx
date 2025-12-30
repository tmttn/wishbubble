"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, User, Bell, Globe } from "lucide-react";
import { toast } from "sonner";

interface UserSettings {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  notifyEmail: boolean;
  notifyInApp: boolean;
  notifyDigest: boolean;
  digestDay: number;
}

const daysOfWeek = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const t = useTranslations("settings");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Update session if name changed
      if (settings.name !== session?.user?.name) {
        await updateSession({ name: settings.name });
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load settings. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("profile.title")}
          </CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={settings.avatarUrl || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(settings.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("profile.avatar")}</p>
              <p className="text-sm text-muted-foreground">
                {t("profile.avatarHint")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("profile.name")}</Label>
            <Input
              id="name"
              value={settings.name || ""}
              onChange={(e) =>
                setSettings({ ...settings, name: e.target.value })
              }
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">{t("profile.email")}</Label>
            <Input
              id="email"
              value={settings.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              {t("profile.emailHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notifications.title")}
          </CardTitle>
          <CardDescription>{t("notifications.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("notifications.email")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("notifications.emailHint")}
              </p>
            </div>
            <Switch
              checked={settings.notifyEmail}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyEmail: checked })
              }
            />
          </div>

          <Separator />

          {/* In-App Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("notifications.inApp")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("notifications.inAppHint")}
              </p>
            </div>
            <Switch
              checked={settings.notifyInApp}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyInApp: checked })
              }
            />
          </div>

          <Separator />

          {/* Weekly Digest */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("notifications.digest")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("notifications.digestHint")}
              </p>
            </div>
            <Switch
              checked={settings.notifyDigest}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyDigest: checked })
              }
            />
          </div>

          {settings.notifyDigest && (
            <div className="pl-4 border-l-2 border-muted">
              <Label>{t("notifications.digestDay")}</Label>
              <Select
                value={String(settings.digestDay)}
                onValueChange={(value) =>
                  setSettings({ ...settings, digestDay: parseInt(value) })
                }
              >
                <SelectTrigger className="w-[180px] mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("language.title")}
          </CardTitle>
          <CardDescription>{t("language.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("language.hint")}
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
