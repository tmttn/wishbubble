"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Loader2, Bug, Lightbulb, HelpCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { toPng } from "html-to-image";

type FeedbackType = "bug" | "feature" | "other";

export function FeedbackButton() {
  const { data: session } = useSession();
  const t = useTypedTranslations("feedback");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Store screenshot data captured before dialog opens
  const screenshotDataRef = useRef<string | null>(null);

  // Listen for recent errors to prefill context
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setLastError(`${event.message} at ${event.filename}:${event.lineno}`);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Capture screenshot when dialog opens (before it covers the page)
  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen && !open) {
      // Capture screenshot before dialog opens
      try {
        const dataUrl = await toPng(document.body, {
          quality: 0.8,
          pixelRatio: 0.5, // Reduce size for faster upload
          backgroundColor: '#ffffff',
          filter: (node) => {
            // Ignore iframes and elements marked to be ignored
            if (node instanceof Element) {
              return node.tagName !== 'IFRAME' && !node.classList?.contains('ignore-screenshot');
            }
            return true;
          },
        });
        screenshotDataRef.current = dataUrl;
      } catch (error) {
        console.error("Failed to capture screenshot:", error);
        screenshotDataRef.current = null;
      }
    }
    setOpen(newOpen);
  };

  const uploadScreenshot = async (): Promise<{ url: string | null; failed: boolean }> => {
    if (!screenshotDataRef.current) return { url: null, failed: false };

    try {
      // Convert base64 data URL to blob (without using fetch to avoid CSP issues)
      const dataUrl = screenshotDataRef.current;
      const [header, base64Data] = dataUrl.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      // Create form data for upload
      const formData = new FormData();
      formData.append("file", blob, `feedback-screenshot-${Date.now()}.png`);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        console.warn("Screenshot upload failed, continuing without screenshot");
        return { url: null, failed: true };
      }

      const data = await uploadResponse.json();
      return { url: data.url, failed: false };
    } catch (error) {
      console.error("Failed to upload screenshot:", error);
      return { url: null, failed: true };
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error(t("messageRequired"));
      return;
    }

    setIsSubmitting(true);
    setIsCapturing(includeScreenshot);

    try {
      // Upload screenshot if enabled
      let screenshotUrl: string | null = null;
      let screenshotFailed = false;
      if (includeScreenshot) {
        const result = await uploadScreenshot();
        screenshotUrl = result.url;
        screenshotFailed = result.failed;
        setIsCapturing(false);
      }

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
          screenshotUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      // Show appropriate success message
      if (screenshotFailed) {
        toast.success(t("submittedWithoutScreenshot"));
      } else {
        toast.success(t("submitted"));
      }
      setOpen(false);
      setMessage("");
      setLastError(null);
      setIncludeScreenshot(false);
      screenshotDataRef.current = null;
    } catch {
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
      setIsCapturing(false);
    }
  };

  // Only show for logged-in users
  if (!session?.user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <div className="flex items-start space-x-3">
            <Checkbox
              id="includeScreenshot"
              checked={includeScreenshot}
              onCheckedChange={(checked) => setIncludeScreenshot(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="includeScreenshot"
                className="flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                <Camera className="h-4 w-4 text-muted-foreground" />
                {t("includeScreenshot")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("screenshotHelp")}
              </p>
            </div>
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
            {isCapturing ? t("capturingScreenshot") : t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
