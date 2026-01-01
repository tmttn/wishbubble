"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Loader2, Bug, Lightbulb, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

type FeedbackType = "bug" | "feature" | "other";

export function FeedbackButton() {
  const { data: session } = useSession();
  const t = useTranslations("feedback");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  // Listen for recent errors to prefill context
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setLastError(`${event.message} at ${event.filename}:${event.lineno}`);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error(t("messageRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href,
        pathname,
        timestamp: new Date().toISOString(),
      };

      // Get Sentry event ID if available (from recent errors)
      const eventId = Sentry.lastEventId();

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feedbackType,
          message: message.trim(),
          browserInfo,
          lastError,
          sentryEventId: eventId,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success(t("submitted"));
      setOpen(false);
      setMessage("");
      setLastError(null);
    } catch {
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show for logged-in users
  if (!session?.user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 shadow-lg bg-background hover:bg-accent"
          aria-label={t("title")}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("type")}</Label>
            <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as FeedbackType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  <span className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-red-500" />
                    {t("typeBug")}
                  </span>
                </SelectItem>
                <SelectItem value="feature">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    {t("typeFeature")}
                  </span>
                </SelectItem>
                <SelectItem value="other">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    {t("typeOther")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              className="min-h-[100px]"
            />
          </div>
          {lastError && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <span className="font-medium">{t("recentError")}:</span> {lastError}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
