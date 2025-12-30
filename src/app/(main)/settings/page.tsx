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
import { Loader2, Save, User, Bell, Globe, Sparkles } from "lucide-react";
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
  const tToasts = useTranslations("toasts");
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
        toast.error(tToasts("error.settingsLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [tToasts]);

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

      toast.success(tToasts("success.settingsSaved"));
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(tToasts("error.settingsSaveFailed"));
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
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-mesh">
        <div className="container px-4 sm:px-6 py-6 md:py-10 max-w-2xl mx-auto">
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t("loadError")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10 max-w-2xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">{t("subtitle")}</p>
        </div>

        {/* Profile Settings */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2 shadow-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              {t("profile.title")}
            </CardTitle>
            <CardDescription>{t("profile.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                <AvatarImage src={settings.avatarUrl || undefined} />
                <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-accent text-white">
                  {getInitials(settings.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium">{t("profile.avatar")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("profile.avatarHint")}
                </p>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("profile.name")}</Label>
              <Input
                id="name"
                value={settings.name || ""}
                onChange={(e) =>
                  setSettings({ ...settings, name: e.target.value })
                }
                placeholder={t("namePlaceholder")}
                className="h-12 rounded-xl bg-background/50"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.email")}</Label>
              <Input
                id="email"
                value={settings.email}
                disabled
                className="h-12 rounded-xl bg-muted/50"
              />
              <p className="text-sm text-muted-foreground">
                {t("profile.emailHint")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 p-2 shadow-lg">
                <Bell className="h-4 w-4 text-white" />
              </div>
              {t("notifications.title")}
            </CardTitle>
            <CardDescription>{t("notifications.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{t("notifications.email")}</Label>
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

            <Separator className="bg-border/50" />

            {/* In-App Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{t("notifications.inApp")}</Label>
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

            <Separator className="bg-border/50" />

            {/* Weekly Digest */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{t("notifications.digest")}</Label>
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
              <div className="pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-xl p-4">
                <Label>{t("notifications.digestDay")}</Label>
                <Select
                  value={String(settings.digestDay)}
                  onValueChange={(value) =>
                    setSettings({ ...settings, digestDay: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-[180px] mt-2 rounded-xl">
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
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 p-2 shadow-lg">
                <Globe className="h-4 w-4 text-white" />
              </div>
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
        <div className="flex justify-end pb-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="group rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 h-12 px-6"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            {t("save")}
            <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </div>
    </div>
  );
}
