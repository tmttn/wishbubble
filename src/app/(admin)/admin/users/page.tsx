import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Crown,
  Clock,
  TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SubscriptionTier, Prisma } from "@prisma/client";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter } from "@/components/admin";

interface UsersPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    tier?: string;
    sort?: string;
    order?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const t = await getTranslations("admin.users");
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const tierFilter = params.tier;
  const perPage = 20;

  const where = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
            { id: query },
          ],
        }
      : {}),
    ...(tierFilter ? { subscriptionTier: tierFilter as SubscriptionTier } : {}),
  };

  const [users, total, tierCounts, recentUsers, adminCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        image: true,
        subscriptionTier: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { bubbleMemberships: true, wishlists: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({
      by: ["subscriptionTier"],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.user.count({
      where: { deletedAt: null, isAdmin: true },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const totalAllUsers = tierCounts.reduce((acc, t) => acc + t._count, 0);

  const freeCount = tierCounts.find((t) => t.subscriptionTier === "FREE")?._count || 0;
  const premiumCount = tierCounts.find((t) => t.subscriptionTier === "PREMIUM")?._count || 0;
  const familyCount = tierCounts.find((t) => t.subscriptionTier === "FAMILY")?._count || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("totalUsers", { count: totalAllUsers })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Users className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
                <p className="text-3xl font-bold">{totalAllUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <UserPlus className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.newThisWeek")}</p>
                <p className="text-3xl font-bold">{recentUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.premium")}</p>
                <p className="text-3xl font-bold">{premiumCount + familyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.admins")}</p>
                <p className="text-3xl font-bold">{adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder={t("searchPlaceholder")}
            defaultValue={query}
            className="pl-10 bg-card/80 backdrop-blur-sm border-0"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/users">
            <Badge
              variant={!tierFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.all")} ({totalAllUsers})
            </Badge>
          </Link>
          <Link href="/admin/users?tier=FREE">
            <Badge
              variant={tierFilter === "FREE" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              Free ({freeCount})
            </Badge>
          </Link>
          <Link href="/admin/users?tier=PREMIUM">
            <Badge
              variant={tierFilter === "PREMIUM" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              Premium ({premiumCount})
            </Badge>
          </Link>
          <Link href="/admin/users?tier=FAMILY">
            <Badge
              variant={tierFilter === "FAMILY" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30"
            >
              Family ({familyCount})
            </Badge>
          </Link>
        </div>
      </div>

      {/* Users list */}
      <div className="grid gap-3">
        {users.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("noUsersFound")}</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user, index) => (
            <Link key={user.id} href={`/admin/users/${user.id}`}>
              <Card
                className="border-0 bg-card/80 backdrop-blur-sm hover:bg-card/95 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-background group-hover:ring-primary/20 transition-all">
                        <AvatarImage
                          src={user.image || user.avatarUrl || undefined}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                          {user.name?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      {user.isAdmin && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {user.name || t("noName")}
                        </p>
                        {user.isAdmin && (
                          <Badge variant="destructive" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{user._count.bubbleMemberships}</p>
                        <p className="text-xs">{t("groups", { count: user._count.bubbleMemberships })}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{user._count.wishlists}</p>
                        <p className="text-xs">{t("wishlists", { count: user._count.wishlists })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          user.subscriptionTier === "PREMIUM"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : user.subscriptionTier === "FAMILY"
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                            : ""
                        }
                      >
                        {user.subscriptionTier}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {user.lastLoginAt
                          ? t("lastLogin", { date: user.lastLoginAt.toLocaleDateString() })
                          : t("neverLoggedIn")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
              className="bg-card/80 backdrop-blur-sm border-0"
            >
              {page > 1 ? (
                <Link href={`/admin/users?${tierFilter ? `tier=${tierFilter}&` : ""}q=${query}&page=${page - 1}`}>
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
              className="bg-card/80 backdrop-blur-sm border-0"
            >
              {page < totalPages ? (
                <Link href={`/admin/users?${tierFilter ? `tier=${tierFilter}&` : ""}q=${query}&page=${page + 1}`}>
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
