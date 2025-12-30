import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const typeFilter = params.type;
  const perPage = 50;

  const where = typeFilter ? { type: typeFilter as any } : {};

  const [activities, total, activityTypes] = await Promise.all([
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

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          {total} total activities (audit log)
        </p>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/activity">
          <Badge
            variant={!typeFilter ? "default" : "outline"}
            className="cursor-pointer"
          >
            All ({total})
          </Badge>
        </Link>
        {activityTypes.map((at) => (
          <Link key={at.type} href={`/admin/activity?type=${at.type}`}>
            <Badge
              variant={typeFilter === at.type ? "default" : "outline"}
              className="cursor-pointer"
            >
              {at.type} ({at._count})
            </Badge>
          </Link>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              No activity recorded
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
                    {activity.bubble ? (
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
                      <span className="text-sm text-muted-foreground">System</span>
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
            Page {page} of {totalPages}
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
                  Previous
                </Link>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
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
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <>
                  Next
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
