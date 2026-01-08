"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Cookies from "js-cookie";
import { Cookie, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const COOKIE_CONSENT_KEY = "cookie-consent";

type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  timestamp: number;
};

// Update Google Consent Mode based on user preferences
function updateGoogleConsent(consent: CookieConsent) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      ad_storage: consent.marketing ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
    });
  }
}

declare global {
  interface Window {
    gtag: (command: string, action: string, params: Record<string, string>) => void;
  }
}

export function CookiePreferencesButton() {
  const t = useTranslations("cookies");
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    preferences: false,
    marketing: false,
    timestamp: 0,
  });

  useEffect(() => {
    const consent = Cookies.get(COOKIE_CONSENT_KEY);
    if (consent) {
      try {
        const parsed = JSON.parse(consent) as CookieConsent;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreferences(parsed);
      } catch {
        // Use defaults
      }
    }
  }, []);

  const handleSave = () => {
    const consentWithTimestamp = { ...preferences, timestamp: Date.now() };
    Cookies.set(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp), {
      expires: 365,
    });
    updateGoogleConsent(consentWithTimestamp);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Cookie className="h-4 w-4" />
          {t("managePreferences")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("preferences.title")}
          </DialogTitle>
          <DialogDescription>
            {t("preferences.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Essential Cookies */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4 bg-green-500/5 border-green-500/20">
            <div className="flex-1">
              <Label className="font-medium">{t("preferences.necessary.title")}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t("preferences.necessary.description")}
              </p>
            </div>
            <Switch checked={true} disabled />
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex-1">
              <Label className="font-medium">{t("preferences.analytics.title")}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t("preferences.analytics.description")}
              </p>
            </div>
            <Switch
              checked={preferences.analytics}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, analytics: checked })
              }
            />
          </div>

          {/* Preference Cookies */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex-1">
              <Label className="font-medium">{t("preferences.preference.title")}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t("preferences.preference.description")}
              </p>
            </div>
            <Switch
              checked={preferences.preferences}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, preferences: checked })
              }
            />
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex-1">
              <Label className="font-medium">{t("preferences.marketing.title")}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t("preferences.marketing.description")}
              </p>
            </div>
            <Switch
              checked={preferences.marketing}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, marketing: checked })
              }
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreferences({ necessary: true, analytics: false, preferences: false, marketing: false, timestamp: 0 });
              }}
            >
              {t("preferences.rejectAll")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreferences({ necessary: true, analytics: true, preferences: true, marketing: true, timestamp: 0 });
              }}
            >
              {t("preferences.acceptAll")}
            </Button>
          </div>
          <Button onClick={handleSave}>
            {t("preferences.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
