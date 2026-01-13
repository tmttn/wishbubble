"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
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
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Bell, Globe, Trash2, AlertTriangle, Download, Shield, Check, CreditCard, Mail, CheckCircle2, Pencil, Smartphone, FlaskConical } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
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
  emailVerified: boolean;
  hasPassword: boolean;
  notifyEmail: boolean;
  notifyInApp: boolean;
  notifyPush: boolean;
  notifyDigest: boolean;
  digestDay: number;
  emailOnMemberJoined: boolean;
  emailOnSecretSantaDraw: boolean;
  emailOnEventReminder: boolean;
  emailOnWishlistReminder: boolean;
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

const locales = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
] as const;

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const t = useTranslations("settings");
  const tToasts = useTranslations("toasts");
  const tDays = useTranslations("settings.notifications.days");
  const router = useRouter();
  const currentLocale = useLocale();
  const [isLocaleChanging, startLocaleTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [_isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isEmailChangeDialogOpen, setIsEmailChangeDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const searchParams = useSearchParams();
  const [isPremium, setIsPremium] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isTogglingBeta, setIsTogglingBeta] = useState(false);
  const initialLoadRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "SettingsPage", action: "fetchSettings" } });
        toast.error(tToasts("error.settingsLoadFailed"));
      } finally {
        setIsLoading(false);
        // Mark initial load as complete after a short delay
        setTimeout(() => {
          initialLoadRef.current = false;
        }, 100);
      }
    };

    const fetchTier = async () => {
      try {
        const response = await fetch("/api/user/tier");
        if (response.ok) {
          const data = await response.json();
          setIsPremium(data.tier !== "FREE");
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "SettingsPage", action: "fetchTier" } });
      }
    };

    const fetchBetaStatus = async () => {
      try {
        const response = await fetch("/api/user/beta");
        if (response.ok) {
          const data = await response.json();
          setIsBetaTester(data.isBetaTester);
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "SettingsPage", action: "fetchBetaStatus" } });
      }
    };

    fetchSettings();
    fetchTier();
    fetchBetaStatus();
  }, [tToasts]);

  const saveSettings = useCallback(async (settingsToSave: UserSettings) => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Update session if name changed
      if (settingsToSave.name !== session?.user?.name) {
        await updateSession({ name: settingsToSave.name });
      }

      setSaveStatus("saved");
      // Reset to idle after showing saved status
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "SettingsPage", action: "saveSettings" } });
      toast.error(tToasts("error.settingsSaveFailed"));
      setSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  }, [session?.user?.name, updateSession, tToasts]);

  // Autosave effect with debounce
  useEffect(() => {
    if (initialLoadRef.current || !settings) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      saveSettings(settings);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [settings, saveSettings]);

  // Handle URL params for email change success/error
  useEffect(() => {
    const emailChanged = searchParams.get("emailChanged");
    const emailChangeError = searchParams.get("emailChangeError");

    if (emailChanged === "true") {
      toast.success(t("profile.emailChangeSuccess"));
      // Remove query params from URL
      router.replace("/settings", { scroll: false });
    } else if (emailChangeError) {
      const errorMessages: Record<string, string> = {
        "missing-token": t("profile.emailChangeErrors.missingToken"),
        "invalid-token": t("profile.emailChangeErrors.invalidToken"),
        "expired-token": t("profile.emailChangeErrors.expiredToken"),
        "user-not-found": t("profile.emailChangeErrors.userNotFound"),
        "email-taken": t("profile.emailChangeErrors.emailTaken"),
        "server-error": t("profile.emailChangeErrors.serverError"),
      };
      toast.error(errorMessages[emailChangeError] || t("profile.emailChangeFailed"));
      router.replace("/settings", { scroll: false });
    }
  }, [searchParams, router, t]);

  const handleEmailChange = async () => {
    if (!newEmail || !emailChangePassword) {
      toast.error(t("profile.emailChangeFieldsRequired"));
      return;
    }

    setIsChangingEmail(true);
    try {
      const response = await fetch("/api/auth/request-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail,
          password: emailChangePassword,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        toast.error(t("profile.emailChangeRateLimited"));
        return;
      }

      if (!response.ok) {
        if (data.error === "Incorrect password") {
          toast.error(t("profile.incorrectPassword"));
        } else if (data.error === "This email is already in use") {
          toast.error(t("profile.emailAlreadyInUse"));
        } else {
          toast.error(data.error || t("profile.emailChangeFailed"));
        }
        return;
      }

      toast.success(t("profile.emailChangeRequested"));
      setIsEmailChangeDialogOpen(false);
      setNewEmail("");
      setEmailChangePassword("");
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "SettingsPage", action: "emailChange" } });
      toast.error(t("profile.emailChangeFailed"));
    } finally {
      setIsChangingEmail(false);
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
      Sentry.captureException(error, { tags: { component: "SettingsPage", action: "exportData" } });
      toast.error(t("privacy.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!settings?.email) return;

    setIsResendingVerification(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: settings.email }),
      });

      const data = await response.json();

      if (response.status === 429) {
        toast.error(t("profile.verificationRateLimited"));
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email");
      }

      toast.success(t("profile.verificationSent"));
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "SettingsPage", action: "resendVerification" } });
      toast.error(t("profile.verificationError"));
    } finally {
      setIsResendingVerification(false);
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
      Sentry.captureException(error, { tags: { component: "SettingsPage", action: "deleteAccount" } });
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

  const handleLocaleChange = async (locale: string) => {
    Cookies.set("locale", locale, { expires: 365 });

    // Save locale preference to database
    try {
      await fetch("/api/user/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "SettingsPage", action: "saveLocale" } });
    }

    startLocaleTransition(() => {
      router.refresh();
    });
  };

  const handleBetaToggle = async (checked: boolean) => {
    setIsTogglingBeta(true);
    try {
      const response = await fetch("/api/user/beta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBetaTester: checked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update beta status");
      }

      setIsBetaTester(checked);
      toast.success(
        checked
          ? t("beta.enabledSuccess")
          : t("beta.disabledSuccess")
      );
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "SettingsPage", action: "toggleBeta" } });
      toast.error(t("beta.toggleError"));
    } finally {
      setIsTogglingBeta(false);
    }
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
        <div className="animate-slide-up flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">{t("subtitle")}</p>
          </div>
          {saveStatus !== "idle" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">{t("saved")}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Profile Settings */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-2 shadow-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              {t("profile.title")}
            </CardTitle>
            <CardDescription>{t("profile.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <PremiumAvatar
                src={settings.image || settings.avatarUrl}
                fallback={getInitials(settings.name)}
                isPremium={isPremium}
                size="xl"
                className="ring-4 ring-primary/10"
              />
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.email")}</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  value={settings.email}
                  disabled
                  className="h-12 rounded-xl bg-muted/50 flex-1"
                />
                {settings.hasPassword && (
                  <Dialog open={isEmailChangeDialogOpen} onOpenChange={setIsEmailChangeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl shrink-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("profile.changeEmail")}</DialogTitle>
                        <DialogDescription>
                          {t("profile.changeEmailDescription")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-email">{t("profile.newEmail")}</Label>
                          <Input
                            id="new-email"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder={t("profile.newEmailPlaceholder")}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email-change-password">{t("profile.confirmPassword")}</Label>
                          <Input
                            id="email-change-password"
                            type="password"
                            value={emailChangePassword}
                            onChange={(e) => setEmailChangePassword(e.target.value)}
                            placeholder={t("profile.passwordPlaceholder")}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEmailChangeDialogOpen(false);
                            setNewEmail("");
                            setEmailChangePassword("");
                          }}
                          className="rounded-xl"
                        >
                          {t("profile.cancel")}
                        </Button>
                        <Button
                          onClick={handleEmailChange}
                          disabled={isChangingEmail || !newEmail || !emailChangePassword}
                          className="rounded-xl"
                        >
                          {isChangingEmail ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="mr-2 h-4 w-4" />
                          )}
                          {t("profile.sendVerification")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {!settings.hasPassword && (
                <p className="text-sm text-muted-foreground">
                  {t("profile.emailHintOAuth")}
                </p>
              )}
            </div>

            {/* Email Verification Status - only show for users with password (not OAuth-only) */}
            {settings.hasPassword && (
              <>
                <Separator className="bg-border/50" />
                <div className="space-y-3">
                  <Label>{t("profile.emailVerification")}</Label>
                  {settings.emailVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">{t("profile.emailVerified")}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Mail className="h-5 w-5" />
                        <span className="text-sm font-medium">{t("profile.emailNotVerified")}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="rounded-xl w-fit"
                      >
                        {isResendingVerification ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        {t("profile.resendVerification")}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-primary/80 to-accent p-2 shadow-lg">
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{t("notifications.emailWishlistReminder")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("notifications.emailWishlistReminderHint")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailOnWishlistReminder}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailOnWishlistReminder: checked })
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

            {/* Push Notifications */}
            <PushNotificationToggle
              isEnabled={settings.notifyPush}
              onToggle={(checked) =>
                setSettings({ ...settings, notifyPush: checked })
              }
              t={t}
            />

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

        {/* Billing & Subscription */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 p-2 shadow-lg">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              {t("billing.title")}
            </CardTitle>
            <CardDescription>{t("billing.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="space-y-0.5">
                <p className="font-medium">{t("billing.manageTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("billing.manageDescription")}
                </p>
              </div>
              <Button
                variant="outline"
                asChild
                className="rounded-xl"
              >
                <Link href="/settings/billing">
                  {t("billing.viewButton")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-accent to-accent/70 p-2 shadow-lg">
                <Globe className="h-4 w-4 text-white" />
              </div>
              {t("language.title")}
            </CardTitle>
            <CardDescription>{t("language.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={currentLocale}
              onValueChange={handleLocaleChange}
              disabled={isLocaleChanging}
            >
              <SelectTrigger className="w-[200px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((locale) => (
                  <SelectItem key={locale.code} value={locale.code}>
                    <span className="flex items-center gap-2">
                      <span>{locale.flag}</span>
                      <span>{locale.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Beta Testing Program */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 p-2 shadow-lg">
                <FlaskConical className="h-4 w-4 text-white" />
              </div>
              {t("beta.title")}
            </CardTitle>
            <CardDescription>{t("beta.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">{t("beta.optIn")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("beta.optInHint")}
                </p>
              </div>
              <Switch
                checked={isBetaTester}
                onCheckedChange={handleBetaToggle}
                disabled={isTogglingBeta}
              />
            </div>
            {isBetaTester && (
              <p className="text-sm text-muted-foreground">
                {t("beta.activeNote")}
              </p>
            )}
          </CardContent>
        </Card>

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

// Separate component to handle push notification toggle with its own hook state
function PushNotificationToggle({
  isEnabled: _isEnabled,
  onToggle,
  t,
}: {
  isEnabled: boolean;
  onToggle: (checked: boolean) => void;
  t: (key: string) => string;
}) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error: _error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await subscribe();
      if (success) {
        onToggle(true);
        toast.success(t("notifications.pushEnabled"));
      } else if (permission === "denied") {
        toast.error(t("notifications.pushDenied"));
      } else {
        toast.error(t("notifications.pushFailed"));
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        onToggle(false);
        toast.success(t("notifications.pushDisabled"));
      }
    }
  };

  const isPermissionDenied = permission === "denied";

  // Show disabled state if not supported (e.g., iOS Safari < 16.4)
  if (!isSupported) {
    return (
      <div className="flex items-center justify-between opacity-50">
        <div className="space-y-0.5">
          <Label className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            {t("notifications.push")}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t("notifications.pushNotSupported")}
          </p>
        </div>
        <Switch checked={false} disabled />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-base flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          {t("notifications.push")}
        </Label>
        <p className="text-sm text-muted-foreground">
          {isPermissionDenied
            ? t("notifications.pushDeniedHint")
            : t("notifications.pushHint")}
        </p>
      </div>
      <Switch
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={isLoading || isPermissionDenied}
      />
    </div>
  );
}
