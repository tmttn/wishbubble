"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { format, isPast } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import {
  Gift,
  Calendar,
  Loader2,
  ShoppingBag,
  Check,
  Eye,
  EyeOff,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemImage } from "@/components/ui/item-image";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Types matching API response
interface GiftHistoryItem {
  claimId: string;
  status: "CLAIMED" | "PURCHASED";
  claimedAt: string;
  purchasedAt: string | null;
  item: {
    id: string;
    title: string;
    imageUrl: string | null;
    uploadedImage: string | null;
    price: number | null;
    priceMax: number | null;
    currency: string;
  };
  recipient: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface GiftHistoryBubble {
  bubble: {
    id: string;
    name: string;
    eventDate: string | null;
    postEventProcessed: boolean;
    archivedAt: string | null;
  };
  items: GiftHistoryItem[];
}

interface GiftHistoryResponse {
  gifts: GiftHistoryBubble[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type FilterType = "all" | "past" | "upcoming";

export default function GiftHistoryPage() {
  const _router = useRouter();
  const t = useTranslations("giftHistory");
  const locale = useLocale();
  const dateLocale = locale === "nl" ? nl : enUS;

  const [gifts, setGifts] = useState<GiftHistoryBubble[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [hasAccess, setHasAccess] = useState(true);

  const fetchGiftHistory = useCallback(async (page = 1, append = false) => {
    try {
      const response = await fetch(`/api/user/gift-history?page=${page}&limit=20`);

      if (response.status === 403) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        const data: GiftHistoryResponse = await response.json();
        if (append) {
          setGifts((prev) => [...prev, ...data.gifts]);
        } else {
          setGifts(data.gifts);
        }
        setPagination(data.pagination);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "GiftHistoryPage", action: "fetchGiftHistory" } });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchGiftHistory();
  }, [fetchGiftHistory]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await fetchGiftHistory(pagination.page + 1, true);
  };

  const formatPrice = (price: number | null, priceMax: number | null, currency: string) => {
    if (price === null) return null;

    const formatter = new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-US", {
      style: "currency",
      currency,
    });

    if (priceMax !== null && priceMax !== price) {
      return `${formatter.format(price)} - ${formatter.format(priceMax)}`;
    }
    return formatter.format(price);
  };

  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), "d MMMM yyyy", { locale: dateLocale });
  };

  const isEventPast = (dateStr: string | null, postEventProcessed: boolean) => {
    if (!dateStr) return postEventProcessed;
    return isPast(new Date(dateStr)) || postEventProcessed;
  };

  // Filter gifts based on selected filter
  const filteredGifts = gifts.filter((group) => {
    if (filter === "all") return true;
    const eventPast = isEventPast(group.bubble.eventDate, group.bubble.postEventProcessed);
    return filter === "past" ? eventPast : !eventPast;
  });

  // Calculate total gifts count
  const totalGiftsCount = filteredGifts.reduce((acc, group) => acc + group.items.length, 0);

  if (isLoading) {
    return (
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Upgrade prompt for users without access
  if (!hasAccess) {
    return (
      <div className="container py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4 mb-4">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("upgradeRequired")}</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {t("upgradeDescription")}
            </p>
            <Button
              className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/pricing">
                {t("upgrade")}
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {(["all", "past", "upcoming"] as FilterType[]).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className={cn(
                filter === filterType && "bg-gradient-to-r from-primary to-accent"
              )}
            >
              {t(`filters.${filterType}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Total count */}
      {totalGiftsCount > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          {t("totalGifts", { count: totalGiftsCount })}
        </p>
      )}

      {filteredGifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("empty")}</h3>
            <p className="text-muted-foreground">{t("emptyDescription")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredGifts.map((group) => {
            const eventPast = isEventPast(group.bubble.eventDate, group.bubble.postEventProcessed);

            return (
              <Card key={group.bubble.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-transparent">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg flex flex-wrap items-center gap-2">
                        <Link
                          href={`/bubbles/${group.bubble.id}`}
                          className="hover:text-primary transition-colors truncate"
                        >
                          {group.bubble.name}
                        </Link>
                        {group.bubble.archivedAt && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Archived
                          </Badge>
                        )}
                      </CardTitle>
                      {group.bubble.eventDate && (
                        <CardDescription className="flex items-center gap-1.5 mt-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{t("eventOn", { date: formatEventDate(group.bubble.eventDate)! })}</span>
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={eventPast ? "secondary" : "default"}
                      className={cn(
                        "shrink-0",
                        !eventPast && "bg-gradient-to-r from-primary to-accent"
                      )}
                    >
                      {eventPast ? t("filters.past") : t("filters.upcoming")}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {group.items.map((gift) => (
                      <div
                        key={gift.claimId}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        {/* Mobile: Image + Title row */}
                        <div className="flex gap-3 sm:contents">
                          <ItemImage
                            src={gift.item.uploadedImage || gift.item.imageUrl}
                            alt={gift.item.title}
                            size="md"
                            className="shrink-0"
                          />

                          {/* Mobile: Stack title and status */}
                          <div className="flex-1 min-w-0 sm:contents">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 sm:block">
                                <p className="font-medium line-clamp-2 sm:truncate">{gift.item.title}</p>
                                {/* Status badge - mobile only inline */}
                                <Badge
                                  variant={gift.status === "PURCHASED" ? "default" : "outline"}
                                  className={cn(
                                    "gap-1 shrink-0 sm:hidden",
                                    gift.status === "PURCHASED" && "bg-green-500/10 text-green-600 border-green-500/20"
                                  )}
                                >
                                  {gift.status === "PURCHASED" ? (
                                    <ShoppingBag className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                  <span className="hidden xs:inline">
                                    {gift.status === "PURCHASED" ? t("status.purchased") : t("status.claimed")}
                                  </span>
                                </Badge>
                              </div>

                              {/* Show recipient only for past events */}
                              {eventPast ? (
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <Eye className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{t("giftFor", { name: gift.recipient.name || "Unknown" })}</span>
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <EyeOff className="h-3.5 w-3.5 shrink-0" />
                                  {t("status.secret")}
                                </p>
                              )}

                              {gift.item.price !== null && (
                                <p className="text-sm font-medium text-primary mt-1">
                                  {formatPrice(gift.item.price, gift.item.priceMax, gift.item.currency)}
                                </p>
                              )}
                            </div>

                            {/* Status badge - desktop only */}
                            <div className="hidden sm:flex flex-col items-end justify-between">
                              <Badge
                                variant={gift.status === "PURCHASED" ? "default" : "outline"}
                                className={cn(
                                  "gap-1",
                                  gift.status === "PURCHASED" && "bg-green-500/10 text-green-600 border-green-500/20"
                                )}
                              >
                                {gift.status === "PURCHASED" ? (
                                  <>
                                    <ShoppingBag className="h-3 w-3" />
                                    {t("status.purchased")}
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" />
                                    {t("status.claimed")}
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {pagination.page < pagination.totalPages && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
