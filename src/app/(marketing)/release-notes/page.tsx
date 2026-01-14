"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { formatDistanceToNow, format } from "date-fns";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, ExternalLink, ArrowLeft, Calendar } from "lucide-react";

interface ReleaseNote {
  id: string;
  titleEn: string;
  titleNl: string;
  bodyEn: string;
  bodyNl: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  publishedAt: string;
}

export default function ReleaseNotesPage() {
  const locale = useLocale();
  const t = useTypedTranslations("releaseNotesPage");
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReleaseNotes = async () => {
      try {
        const response = await fetch("/api/release-notes?limit=50");
        if (response.ok) {
          const data = await response.json();
          setReleaseNotes(data.releaseNotes);
        }
      } catch (error) {
        console.error("Failed to fetch release notes", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleaseNotes();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM d, yyyy", {
      locale: locale === "nl" ? nl : enUS,
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: locale === "nl" ? nl : enUS,
    });
  };

  // Group release notes by month/year
  const groupedNotes = releaseNotes.reduce((acc, note) => {
    const date = new Date(note.publishedAt);
    const key = format(date, "MMMM yyyy", {
      locale: locale === "nl" ? nl : enUS,
    });
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(note);
    return acc;
  }, {} as Record<string, ReleaseNote[]>);

  return (
    <div className="container max-w-4xl py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white">
          <Megaphone className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : releaseNotes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="h-16 w-16 mx-auto text-muted-foreground/50 mb-6" />
            <h3 className="text-xl font-medium">{t("noReleaseNotes")}</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {t("noReleaseNotesDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedNotes).map(([monthYear, notes]) => (
            <div key={monthYear} className="space-y-4">
              <h2 className="text-2xl font-semibold text-muted-foreground border-b pb-2">
                {monthYear}
              </h2>
              <div className="space-y-6">
                {notes.map((note) => {
                  const title = locale === "nl" ? note.titleNl : note.titleEn;
                  const body = locale === "nl" ? note.bodyNl : note.bodyEn;

                  return (
                    <Card key={note.id} className="overflow-hidden">
                      {note.imageUrl && (
                        <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
                          <Image
                            src={note.imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(note.publishedAt)}</span>
                              <span className="text-muted-foreground/50">
                                ({formatRelativeDate(note.publishedAt)})
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {body}
                        </p>

                        {note.ctaUrl && (
                          <Button variant="link" className="px-0 h-auto" asChild>
                            <a
                              href={note.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1"
                            >
                              {note.ctaLabel || t("learnMore")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center pt-8">
        <Button variant="outline" asChild>
          <Link href="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
