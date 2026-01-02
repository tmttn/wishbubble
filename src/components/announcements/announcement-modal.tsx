"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  titleEn: string;
  titleNl: string;
  bodyEn: string;
  bodyNl: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  publishedAt: string;
  isDismissed: boolean;
}

export function AnnouncementModal() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("announcements");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const response = await fetch("/api/announcements?unreadOnly=true&limit=10");
      if (response.ok) {
        const data = await response.json();
        if (data.announcements.length > 0) {
          setAnnouncements(data.announcements);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch announcements", error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    // Small delay to avoid showing modal immediately on page load
    const timer = setTimeout(() => {
      fetchAnnouncements();
    }, 1000);

    return () => clearTimeout(timer);
  }, [fetchAnnouncements]);

  const dismissAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/dismiss`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to dismiss announcement", error);
    }
  };

  const handleDismiss = async () => {
    const current = announcements[currentIndex];
    if (current) {
      await dismissAnnouncement(current.id);
    }

    if (currentIndex < announcements.length - 1) {
      // Move to next announcement
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Close modal when all announcements are dismissed
      setIsOpen(false);
    }
  };

  const handleDismissAll = async () => {
    // Dismiss all remaining announcements
    const remaining = announcements.slice(currentIndex);
    await Promise.all(remaining.map((a) => dismissAnnouncement(a.id)));
    setIsOpen(false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!session || isLoading || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex];
  const title = locale === "nl" ? current.titleNl : current.titleEn;
  const body = locale === "nl" ? current.bodyNl : current.bodyEn;
  const hasMultiple = announcements.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismissAll()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {hasMultiple && (
            <DialogDescription>
              {t("announcementCount", {
                current: currentIndex + 1,
                total: announcements.length,
              })}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {current.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={current.imageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">{body}</p>
          </div>

          {current.ctaUrl && (
            <Button variant="link" className="px-0 h-auto" asChild>
              <a
                href={current.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                {current.ctaLabel || t("learnMore")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasMultiple && (
            <div className="flex items-center gap-2 sm:mr-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1">
                {announcements.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      idx === currentIndex
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === announcements.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            {hasMultiple && (
              <Button
                variant="ghost"
                onClick={handleDismissAll}
                className="flex-1 sm:flex-none"
              >
                {t("dismissAll")}
              </Button>
            )}
            <Button onClick={handleDismiss} className="flex-1 sm:flex-none">
              {currentIndex < announcements.length - 1
                ? t("next")
                : t("gotIt")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
