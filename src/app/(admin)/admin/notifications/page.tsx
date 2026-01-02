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

export default function AdminNotificationsPage() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [emailTypes, setEmailTypes] = useState<NotificationType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [channel, setChannel] = useState<"notification" | "email" | "both">("both");
  const [locale, setLocale] = useState<string>("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);

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

    try {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Testing</h1>
        <p className="text-muted-foreground mt-1">
          Test all notification types to verify translations and delivery
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test
            </CardTitle>
            <CardDescription>
              Configure and send a test notification or email to yourself
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Channel Selection */}
            <div className="space-y-3">
              <Label>Delivery Channel</Label>
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
                  In-App Only
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
                  Email Only
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
                  Both
                </Button>
              </div>
            </div>

            {/* Type Selection */}
            <div className="space-y-3">
              <Label>Notification Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type..." />
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
              <Label>Language</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                </SelectContent>
              </Select>
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Results from the last test sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {lastResult.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        All tests passed
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-700 dark:text-red-400">
                        Some tests failed
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sent to:</span>
                    <span className="font-mono">{lastResult.sentTo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Language:</span>
                    <Badge variant="secondary">{lastResult.locale}</Badge>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {lastResult.results.notification !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        In-App Notification
                      </span>
                      {lastResult.results.notification ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  )}
                  {lastResult.results.email !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </span>
                      {lastResult.results.email ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  )}
                </div>

                {lastResult.results.errors && lastResult.results.errors.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      Errors:
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
                <p>No tests run yet</p>
                <p className="text-sm mt-1">
                  Send a test to see results here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
          <CardDescription>
            All available notification and email types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                In-App Notifications
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
                Email Templates
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
