"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Mail, Send, Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";

interface NotificationType {
  id: string;
  label: string;
  description: string;
}

interface TestResult {
  success: boolean;
  results: {
    notification?: boolean;
    email?: boolean;
    errors?: string[];
  };
  sentTo: string;
  locale: string;
}

interface MultiLocaleResult {
  overall: boolean;
  localeResults: TestResult[];
}

export default function AdminNotificationsPage() {
  const t = useTypedTranslations("admin.notificationsPage");
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [emailTypes, setEmailTypes] = useState<NotificationType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [channel, setChannel] = useState<"notification" | "email" | "both">("both");
  const [locale, setLocale] = useState<string>("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [multiLocaleResult, setMultiLocaleResult] = useState<MultiLocaleResult | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch("/api/admin/notifications/test");
        if (response.ok) {
          const data = await response.json();
          setNotificationTypes(data.notificationTypes);
          setEmailTypes(data.emailTypes);
          if (data.notificationTypes.length > 0) {
            setSelectedType(data.notificationTypes[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch notification types", error);
        toast.error("Failed to load notification types");
      } finally {
        setIsFetching(false);
      }
    };
    fetchTypes();
  }, []);

  const handleSendTest = async () => {
    if (!selectedType) {
      toast.error("Please select a notification type");
      return;
    }

    setIsLoading(true);
    setLastResult(null);
    setMultiLocaleResult(null);

    try {
      if (locale === "all") {
        // Send tests for all languages
        const locales = ["en", "nl"];
        const results: TestResult[] = [];
        let overallSuccess = true;

        for (const loc of locales) {
          const response = await fetch("/api/admin/notifications/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: selectedType, channel, locale: loc }),
          });

          const data = await response.json();

          if (response.ok) {
            results.push(data);
            if (!data.success) {
              overallSuccess = false;
            }
          } else {
            results.push({
              success: false,
              results: { errors: [data.error || "Request failed"] },
              sentTo: "",
              locale: loc,
            });
            overallSuccess = false;
          }
        }

        setMultiLocaleResult({ overall: overallSuccess, localeResults: results });
        if (overallSuccess) {
          toast.success("Tests sent in all languages!");
        } else {
          toast.error("Some tests failed. Check results below.");
        }
      } else {
        // Single locale test
        const response = await fetch("/api/admin/notifications/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: selectedType, channel, locale }),
        });

        const data = await response.json();

        if (response.ok) {
          setLastResult(data);
          if (data.success) {
            toast.success("Test sent successfully!");
          } else {
            toast.error("Some tests failed. Check results below.");
          }
        } else {
          toast.error(data.error || "Failed to send test");
        }
      }
    } catch (error) {
      console.error("Failed to send test", error);
      toast.error("Failed to send test notification");
    } finally {
      setIsLoading(false);
    }
  };

  const currentTypes = channel === "email" ? emailTypes : notificationTypes;
  const selectedTypeInfo = [...notificationTypes, ...emailTypes].find(
    (t) => t.id === selectedType
  );

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {t("sendTest")}
            </CardTitle>
            <CardDescription>
              {t("sendTestDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Channel Selection */}
            <div className="space-y-3">
              <Label>{t("deliveryChannel")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={channel === "notification" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setChannel("notification");
                    if (notificationTypes.length > 0) {
                      setSelectedType(notificationTypes[0].id);
                    }
                  }}
                  className={cn("flex-1", channel === "notification" && "ring-2 ring-primary ring-offset-2")}
                >
                  <Bell className="h-4 w-4 mr-1.5" />
                  {t("inAppOnly")}
                </Button>
                <Button
                  type="button"
                  variant={channel === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setChannel("email");
                    if (emailTypes.length > 0) {
                      setSelectedType(emailTypes[0].id);
                    }
                  }}
                  className={cn("flex-1", channel === "email" && "ring-2 ring-primary ring-offset-2")}
                >
                  <Mail className="h-4 w-4 mr-1.5" />
                  {t("emailOnly")}
                </Button>
                <Button
                  type="button"
                  variant={channel === "both" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setChannel("both");
                    if (notificationTypes.length > 0) {
                      setSelectedType(notificationTypes[0].id);
                    }
                  }}
                  className={cn("flex-1", channel === "both" && "ring-2 ring-primary ring-offset-2")}
                >
                  {t("both")}
                </Button>
              </div>
            </div>

            {/* Type Selection */}
            <div className="space-y-3">
              <Label>{t("notificationType")}</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {currentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTypeInfo && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  {selectedTypeInfo.description}
                </p>
              )}
            </div>

            {/* Locale Selection */}
            <div className="space-y-3">
              <Label>{t("language")}</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="all">{t("allLanguages")}</SelectItem>
                </SelectContent>
              </Select>
              {locale === "all" && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  {t("allLanguagesNote")}
                </p>
              )}
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendTest}
              disabled={isLoading || !selectedType}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t("sendTest")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>{t("results")}</CardTitle>
            <CardDescription>
              {t("resultsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {multiLocaleResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {multiLocaleResult.overall ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <span className="font-medium text-accent-foreground">
                        {t("allLanguagesPassed")}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-700 dark:text-red-400">
                        {t("someTestsFailed")}
                      </span>
                    </>
                  )}
                </div>

                {multiLocaleResult.localeResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-sm">
                        {result.locale === "en" ? "English" : "Nederlands"}
                      </Badge>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-accent" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      {result.results.notification !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Bell className="h-3 w-3" />
                            {t("notification")}
                          </span>
                          {result.results.notification ? (
                            <Badge className="bg-accent/20 text-accent-foreground text-xs">
                              {t("sent")}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">{t("failed")}</Badge>
                          )}
                        </div>
                      )}
                      {result.results.email !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {t("email")}
                          </span>
                          {result.results.email ? (
                            <Badge className="bg-accent/20 text-accent-foreground text-xs">
                              {t("sent")}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">{t("failed")}</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {result.results.errors && result.results.errors.length > 0 && (
                      <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 mt-2">
                        {result.results.errors.map((error, i) => (
                          <li key={i} className="font-mono">
                            {error}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : lastResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {lastResult.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <span className="font-medium text-accent-foreground">
                        {t("allTestsPassed")}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-700 dark:text-red-400">
                        {t("someTestsFailed")}
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("sentTo")}:</span>
                    <span className="font-mono">{lastResult.sentTo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("language")}:</span>
                    <Badge variant="secondary">{lastResult.locale}</Badge>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {lastResult.results.notification !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        {t("inAppNotification")}
                      </span>
                      {lastResult.results.notification ? (
                        <Badge className="bg-accent/20 text-accent-foreground">
                          {t("sent")}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">{t("failed")}</Badge>
                      )}
                    </div>
                  )}
                  {lastResult.results.email !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {t("email")}
                      </span>
                      {lastResult.results.email ? (
                        <Badge className="bg-accent/20 text-accent-foreground">
                          {t("sent")}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">{t("failed")}</Badge>
                      )}
                    </div>
                  )}
                </div>

                {lastResult.results.errors && lastResult.results.errors.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      {t("errors")}:
                    </p>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                      {lastResult.results.errors.map((error, i) => (
                        <li key={i} className="font-mono text-xs">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("noTestsYet")}</p>
                <p className="text-sm mt-1">
                  {t("sendTestToSeeResults")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quickReference")}</CardTitle>
          <CardDescription>
            {t("quickReferenceDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t("inAppNotifications")}
              </h3>
              <div className="space-y-2">
                {notificationTypes.map((type) => (
                  <div key={type.id} className="text-sm">
                    <span className="font-medium">{type.label}</span>
                    <p className="text-muted-foreground text-xs">
                      {type.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("emailTemplates")}
              </h3>
              <div className="space-y-2">
                {emailTypes.map((type) => (
                  <div key={type.id} className="text-sm">
                    <span className="font-medium">{type.label}</span>
                    <p className="text-muted-foreground text-xs">
                      {type.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
