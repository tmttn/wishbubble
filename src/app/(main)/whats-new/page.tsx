"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ExternalLink, Check, ArrowLeft } from "lucide-react";

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

export default function WhatsNewPage() {
  const locale = useLocale();
  const t = useTranslations("announcements");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements?limit=50");
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.announcements);
        }
      } catch (error) {
        console.error("Failed to fetch announcements", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const dismissAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/dismiss`, {
        method: "POST",
      });
      // Update local state
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isDismissed: true } : a))
      );
    } catch (error) {
      console.error("Failed to dismiss announcement", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: locale === "nl" ? nl : enUS,
    });
  };

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-amber-500" />
            {t("whatsNewTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("whatsNewDescription")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t("noAnnouncements")}</h3>
            <p className="text-muted-foreground mt-1">
              {t("noAnnouncementsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const title =
              locale === "nl" ? announcement.titleNl : announcement.titleEn;
            const body =
              locale === "nl" ? announcement.bodyNl : announcement.bodyEn;

            return (
              <Card
                key={announcement.id}
                className={announcement.isDismissed ? "opacity-75" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {title}
                        {announcement.isDismissed && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            {t("read")}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(announcement.publishedAt)}
                      </CardDescription>
                    </div>
                    {!announcement.isDismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAnnouncement(announcement.id)}
                      >
                        {t("markAsRead")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcement.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={announcement.imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {body}
                  </p>

                  {announcement.ctaUrl && (
                    <Button variant="link" className="px-0 h-auto" asChild>
                      <a
                        href={announcement.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        {announcement.ctaLabel || t("learnMore")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
