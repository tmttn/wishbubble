"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Cookies from "js-cookie";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

// Update Facebook Pixel consent based on user preferences
function updateFacebookConsent(consent: CookieConsent) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (consent.marketing) {
      // Grant consent and track page view
      window.fbq("consent", "grant");
      window.fbq("track", "PageView");
    } else {
      // Revoke consent
      window.fbq("consent", "revoke");
    }
  }
}

// Declare gtag and fbq on window
declare global {
  interface Window {
    gtag: (command: string, action: string, params: Record<string, string>) => void;
    fbq: ((command: string, event: string) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
  }
}

export function CookieBanner() {
  const t = useTranslations("cookies.banner");
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    preferences: false,
    marketing: false,
    timestamp: 0,
  });

  useEffect(() => {
    const consent = Cookies.get(COOKIE_CONSENT_KEY);
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(consent) as CookieConsent;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreferences(parsed);
        // Update Google Consent Mode with stored preferences
        updateGoogleConsent(parsed);
        // Update Facebook Pixel consent with stored preferences
        updateFacebookConsent(parsed);
      } catch {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (consent: CookieConsent) => {
    const consentWithTimestamp = { ...consent, timestamp: Date.now() };
    Cookies.set(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp), {
      expires: 365,
    });
    setPreferences(consentWithTimestamp);
    setShowBanner(false);
    setShowPreferences(false);
    // Update Google Consent Mode
    updateGoogleConsent(consentWithTimestamp);
    // Update Facebook Pixel consent
    updateFacebookConsent(consentWithTimestamp);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      preferences: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl p-6 shadow-lg">
        {showPreferences ? (
          <CookiePreferences
            preferences={preferences}
            setPreferences={setPreferences}
            onSave={handleSavePreferences}
            onBack={() => setShowPreferences(false)}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{t("title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("description")}{" "}
                  <Link href="/cookies" className="underline hover:text-foreground">
                    {t("learnMore")}
                  </Link>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={handleRejectAll}
                aria-label="Dismiss cookie banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleAcceptAll}>{t("acceptAll")}</Button>
              <Button variant="outline" onClick={handleRejectAll}>
                {t("rejectAll")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPreferences(true)}
              >
                {t("customize")}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function CookiePreferences({
  preferences,
  setPreferences,
  onSave,
  onBack,
}: {
  preferences: CookieConsent;
  setPreferences: (prefs: CookieConsent) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("cookies.preferences");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Back
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div>
            <h4 className="font-medium">{t("necessary.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("necessary.description")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={true}
            disabled
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div>
            <h4 className="font-medium">{t("analytics.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("analytics.description")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.analytics}
            onChange={(e) =>
              setPreferences({ ...preferences, analytics: e.target.checked })
            }
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div>
            <h4 className="font-medium">{t("preferences.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("preferences.description")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.preferences}
            onChange={(e) =>
              setPreferences({ ...preferences, preferences: e.target.checked })
            }
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div>
            <h4 className="font-medium">{t("marketing.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("marketing.description")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.marketing}
            onChange={(e) =>
              setPreferences({ ...preferences, marketing: e.target.checked })
            }
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>
      </div>

      <Button onClick={onSave} className="w-full">
        {t("save")}
      </Button>
    </div>
  );
}
