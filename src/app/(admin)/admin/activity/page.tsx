import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Activity, TrendingUp, Users, Calendar } from "lucide-react";
import { logger } from "@/lib/logger";
import { getTranslations } from "next-intl/server";

interface ActivityPageProps {
  searchParams: Promise<{ page?: string; type?: string }>;
}

const activityTypeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  // Auth events
  USER_REGISTERED: "default",
  USER_LOGIN: "secondary",
  USER_LOGOUT: "outline",
  EMAIL_VERIFIED: "default",
  PASSWORD_RESET_REQUESTED: "outline",
  PASSWORD_RESET_COMPLETED: "default",
  VERIFICATION_EMAIL_RESENT: "outline",
  // Member events
  MEMBER_JOINED: "default",
  MEMBER_LEFT: "destructive",
  MEMBER_REMOVED: "destructive",
  MEMBER_INVITED: "secondary",
  // Wishlist events
  WISHLIST_CREATED: "default",
  WISHLIST_ATTACHED: "secondary",
  WISHLIST_DETACHED: "outline",
  ITEM_ADDED: "secondary",
  ITEM_UPDATED: "secondary",
  ITEM_DELETED: "destructive",
  // Claim events
  ITEM_CLAIMED: "default",
  ITEM_UNCLAIMED: "outline",
  ITEM_PURCHASED: "default",
  // Group events
  GROUP_CREATED: "default",
  GROUP_UPDATED: "secondary",
  GROUP_DELETED: "destructive",
  GROUP_ARCHIVED: "outline",
  SECRET_SANTA_DRAWN: "default",
  // System events
  EVENT_APPROACHING: "outline",
};

export default async function AdminActivityPage({ searchParams }: ActivityPageProps) {
  const t = await getTranslations("admin.activityPage");
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const typeFilter = params.type;
  const perPage = 50;

  const where = typeFilter ? { type: typeFilter as any } : {};

  let activities: Awaited<ReturnType<typeof prisma.activity.findMany<{
    include: { bubble: { select: { id: true; name: true } }; user: { select: { id: true; name: true; email: true } } }
  }>>> = [];
  let total = 0;
  let activityTypes: { type: string; _count: number }[] = [];

  try {
    [activities, total, activityTypes] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          bubble: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.activity.count({ where }),
      prisma.activity.groupBy({
        by: ["type"],
        _count: true,
        orderBy: { _count: { type: "desc" } },
      }),
    ]);
  } catch (error) {
    logger.error("Error fetching admin activities", error, { page, typeFilter });
  }

  const totalPages = Math.ceil(total / perPage);

  // Calculate stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const userEvents = activityTypes.filter(at =>
    at.type.includes("USER") || at.type.includes("LOGIN") || at.type.includes("MEMBER")
  ).reduce((acc, at) => acc + at._count, 0);

  const itemEvents = activityTypes.filter(at =>
    at.type.includes("ITEM") || at.type.includes("WISHLIST") || at.type.includes("CLAIM")
  ).reduce((acc, at) => acc + at._count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("totalActivities", { count: total })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-violet-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-xl">
                <Activity className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
                <p className="text-3xl font-bold">{total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Users className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.userEvents")}</p>
                <p className="text-3xl font-bold">{userEvents.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.itemEvents")}</p>
                <p className="text-3xl font-bold">{itemEvents.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.eventTypes")}</p>
                <p className="text-3xl font-bold">{activityTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/activity">
          <Badge
            variant={!typeFilter ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 text-sm"
          >
            {t("all")} ({total})
          </Badge>
        </Link>
        {activityTypes.slice(0, 10).map((at) => (
          <Link key={at.type} href={`/admin/activity?type=${at.type}`}>
            <Badge
              variant={typeFilter === at.type ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {at.type} ({at._count})
            </Badge>
          </Link>
        ))}
        {activityTypes.length > 10 && (
          <Badge variant="outline" className="px-3 py-1.5 text-sm text-muted-foreground">
            +{activityTypes.length - 10} more
          </Badge>
        )}
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("noActivityRecorded")}
            </CardContent>
          </Card>
        ) : (
          activities.map((activity) => (
            <Card
              key={activity.id}
              className="border-0 bg-card/80 backdrop-blur-sm"
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge variant={activityTypeColors[activity.type] || "outline"}>
                      {activity.type}
                    </Badge>
                    {activity.user && activity.bubble ? (
                      <span className="text-sm truncate">
                        <Link
                          href={`/admin/users/${activity.user.id}`}
                          className="font-medium hover:underline"
                        >
                          {activity.user.name || activity.user.email}
                        </Link>
                        <span className="text-muted-foreground mx-1">&rarr;</span>
                        <Link
                          href={`/admin/groups/${activity.bubble.id}`}
                          className="font-medium hover:underline"
                        >
                          {activity.bubble.name}
                        </Link>
                      </span>
                    ) : activity.bubble ? (
                      <Link
                        href={`/admin/groups/${activity.bubble.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {activity.bubble.name}
                      </Link>
                    ) : activity.user ? (
                      <Link
                        href={`/admin/users/${activity.user.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {activity.user.name || activity.user.email}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t("system")}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {activity.metadata && (
                      <span className="text-xs text-muted-foreground font-mono hidden lg:block">
                        {JSON.stringify(activity.metadata).slice(0, 50)}
                        {JSON.stringify(activity.metadata).length > 50 && "..."}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.createdAt.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("pagination", { page, totalPages })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link
                  href={`/admin/activity?${typeFilter ? `type=${typeFilter}&` : ""}page=${page - 1}`}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("previous")}
                </Link>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("previous")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link
                  href={`/admin/activity?${typeFilter ? `type=${typeFilter}&` : ""}page=${page + 1}`}
                >
                  {t("next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <>
                  {t("next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
