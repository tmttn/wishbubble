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
import { Loader2, Save, User, Bell, Globe, Sparkles, Trash2, AlertTriangle, Download, Shield } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
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

interface UserSettings {
  name: string | null;
  email: string;
  image: string | null;
  avatarUrl: string | null;
  notifyEmail: boolean;
  notifyInApp: boolean;
  notifyDigest: boolean;
  digestDay: number;
  emailOnMemberJoined: boolean;
  emailOnSecretSantaDraw: boolean;
  emailOnEventReminder: boolean;
}

const dayKeys = [
  { value: "0", key: "sunday" },
  { value: "1", key: "monday" },
  { value: "2", key: "tuesday" },
  { value: "3", key: "wednesday" },
  { value: "4", key: "thursday" },
  { value: "5", key: "friday" },
  { value: "6", key: "saturday" },
] as const;

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const t = useTranslations("settings");
  const tToasts = useTranslations("toasts");
  const tDays = useTranslations("settings.notifications.days");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
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

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/user/export");
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "wishbubble-data-export.json";

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t("privacy.exportSuccess"));
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error(t("privacy.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error(t("dangerZone.deleteConfirmError"));
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.bubbles) {
          toast.error(t("dangerZone.transferBubblesFirst"));
        } else {
          throw new Error(data.error || "Failed to delete account");
        }
        return;
      }

      toast.success(t("dangerZone.deleteSuccess"));
      // Sign out and redirect to home
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(tToasts("error.accountDeleteFailed"));
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation("");
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
                <AvatarImage src={settings.image || settings.avatarUrl || undefined} />
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

            {/* Fine-grained email notification settings */}
            {settings.notifyEmail && (
              <div className="pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-xl p-4 space-y-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {t("notifications.emailTypes")}
                </p>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{t("notifications.emailMemberJoined")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("notifications.emailMemberJoinedHint")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailOnMemberJoined}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailOnMemberJoined: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{t("notifications.emailSecretSanta")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("notifications.emailSecretSantaHint")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailOnSecretSantaDraw}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailOnSecretSantaDraw: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{t("notifications.emailEventReminder")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("notifications.emailEventReminderHint")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailOnEventReminder}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailOnEventReminder: checked })
                    }
                  />
                </div>
              </div>
            )}

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
                    {dayKeys.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {tDays(day.key)}
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
        <div className="flex justify-end">
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
            <Sparkles className="h-4 w-4 ml-2 transition-colors group-hover:text-yellow-200" />
          </Button>
        </div>

        {/* Privacy & Data */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2 shadow-lg">
                <Shield className="h-4 w-4 text-white" />
              </div>
              {t("privacy.title")}
            </CardTitle>
            <CardDescription>{t("privacy.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="space-y-0.5">
                <p className="font-medium">{t("privacy.exportTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("privacy.exportDescription")}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="rounded-xl"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t("privacy.exportButton")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("privacy.gdprNote")}
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-2 shadow-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              {t("dangerZone.title")}
            </CardTitle>
            <CardDescription>{t("dangerZone.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("dangerZone.deleteWarning")}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("dangerZone.deleteButton")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      {t("dangerZone.deleteDialogTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>{t("dangerZone.deleteDialogDescription")}</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>{t("dangerZone.deleteItem1")}</li>
                        <li>{t("dangerZone.deleteItem2")}</li>
                        <li>{t("dangerZone.deleteItem3")}</li>
                        <li>{t("dangerZone.deleteItem4")}</li>
                      </ul>
                      <div className="pt-2">
                        <Label htmlFor="delete-confirm" className="text-foreground">
                          {t("dangerZone.typeDelete")}
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                          className="mt-2"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                      {t("dangerZone.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== "DELETE" || isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {t("dangerZone.confirmDelete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <div className="pb-4" />
      </div>
    </div>
  );
}
