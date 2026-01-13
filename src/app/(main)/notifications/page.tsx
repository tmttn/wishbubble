"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  Gift,
  Users,
  Shuffle,
  Calendar,
  Trash2,
  Loader2,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  bubbleId: string | null;
  itemId: string | null;
  readAt: string | null;
  createdAt: string;
  data: Record<string, unknown> | null;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [_total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (offset = 0) => {
    try {
      const response = await fetch(`/api/notifications?limit=20&offset=${offset}`);
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        if (offset === 0) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setUnreadCount(data.unreadCount);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "NotificationsPage", action: "fetchNotifications" } });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await fetchNotifications(notifications.length);
  };

  const handleMarkAsRead = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "NotificationsPage", action: "markAsRead" } });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading("all");
    try {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "NotificationsPage", action: "markAllAsRead" } });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    setActionLoading("deleteAll");
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      setHasMore(false);
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "NotificationsPage", action: "deleteAll" } });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const wasUnread = notifications.find((n) => n.id === id)?.readAt === null;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "NotificationsPage", action: "deleteNotification" } });
    } finally {
      setActionLoading(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      handleMarkAsRead(notification.id);
    }

    if (notification.bubbleId) {
      router.push(`/bubbles/${notification.bubbleId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ITEM_CLAIMED":
      case "WISHLIST_ADDED":
        return <Gift className="h-5 w-5" />;
      case "MEMBER_JOINED":
      case "BUBBLE_INVITATION":
        return <Users className="h-5 w-5" />;
      case "SECRET_SANTA_DRAWN":
        return <Shuffle className="h-5 w-5" />;
      case "EVENT_APPROACHING":
        return <Calendar className="h-5 w-5" />;
      case "PRICE_DROP":
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          {unreadCount > 0 && (
            <p className="text-muted-foreground mt-1">
              {t("unreadCount", { count: unreadCount })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === "all"}
            >
              {actionLoading === "all" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              {t("markAllRead")}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleDeleteAll}
              disabled={actionLoading === "deleteAll"}
              className="text-muted-foreground hover:text-destructive hover:border-destructive"
            >
              {actionLoading === "deleteAll" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t("deleteAll")}
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("emptyTitle")}</h3>
            <p className="text-muted-foreground">{t("emptyDescription")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                !notification.readAt && "bg-primary/5 border-primary/20"
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="flex gap-4 flex-1 text-left"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        !notification.readAt
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm",
                          !notification.readAt && "font-medium"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-start gap-1">
                    {!notification.readAt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        disabled={actionLoading === notification.id}
                      >
                        {actionLoading === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      disabled={actionLoading === notification.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("loadMore")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
