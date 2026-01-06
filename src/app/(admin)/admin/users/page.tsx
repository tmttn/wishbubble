import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Crown,
  TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SubscriptionTier, Prisma } from "@prisma/client";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter, MobileScrollContainer } from "@/components/admin";
import { UsersListClient } from "@/components/admin/users-list-client";

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
  const perPage = parseInt(params.perPage || "20");
  const sort = params.sort || "createdAt";
  const order = (params.order || "desc") as "asc" | "desc";
  const fromDate = params.from;
  const toDate = params.to;

  // Build where clause
  const where: Prisma.UserWhereInput = {
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
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  };

  // Build orderBy clause
  const orderBy: Prisma.UserOrderByWithRelationInput = {};
  if (sort === "name") {
    orderBy.name = order;
  } else if (sort === "email") {
    orderBy.email = order;
  } else if (sort === "lastLoginAt") {
    orderBy.lastLoginAt = order;
  } else if (sort === "tier") {
    orderBy.subscriptionTier = order;
  } else {
    orderBy.createdAt = order;
  }

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
      orderBy,
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <AdminSearch
            placeholder={t("searchPlaceholder")}
            defaultValue={query}
            baseUrl="/admin/users"
            searchParams={{ tier: tierFilter, sort, order, from: fromDate, to: toDate }}
          />
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, sort, order }}
          />
        </div>
        <MobileScrollContainer>
          <Link href={`/admin/users${query ? `?q=${query}` : ""}${sort !== "createdAt" ? `${query ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!tierFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
            >
              {t("filters.all")} ({totalAllUsers})
            </Badge>
          </Link>
          <Link href={`/admin/users?tier=FREE${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={tierFilter === "FREE" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
            >
              Free ({freeCount})
            </Badge>
          </Link>
          <Link href={`/admin/users?tier=PREMIUM${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={tierFilter === "PREMIUM" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              Premium ({premiumCount})
            </Badge>
          </Link>
          <Link href={`/admin/users?tier=FAMILY${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={tierFilter === "FAMILY" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30"
            >
              Family ({familyCount})
            </Badge>
          </Link>
        </MobileScrollContainer>
        {/* Sort options */}
        <MobileScrollContainer className="items-center text-sm">
          <span className="text-muted-foreground shrink-0">{t("sortBy")}:</span>
          <AdminSortHeader
            label={t("sortOptions.createdAt")}
            sortKey="createdAt"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.name")}
            sortKey="name"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.email")}
            sortKey="email"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.lastLogin")}
            sortKey="lastLoginAt"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.tier")}
            sortKey="tier"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
        </MobileScrollContainer>
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t("noUsersFound")}</p>
          </CardContent>
        </Card>
      ) : (
        <UsersListClient
          users={users}
          labels={{
            noName: t("noName"),
            groups: t("groups", { count: 0 }).replace("0", ""),
            wishlists: t("wishlists", { count: 0 }).replace("0", ""),
            lastLogin: t("lastLogin", { date: "{date}" }),
            neverLoggedIn: t("neverLoggedIn"),
          }}
        />
      )}

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        baseUrl="/admin/users"
        searchParams={{
          q: query,
          tier: tierFilter,
          sort: sort !== "createdAt" ? sort : undefined,
          order: sort !== "createdAt" ? order : undefined,
          from: fromDate,
          to: toDate,
        }}
      />
    </div>
  );
}
