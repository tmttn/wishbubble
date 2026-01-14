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
import { SubscriptionTier, SubscriptionStatus, Prisma } from "@prisma/client";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter, MobileScrollContainer } from "@/components/admin";
import { UsersListClient } from "@/components/admin/users-list-client";

interface UsersPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    tier?: string;
    status?: string;
    sort?: string;
    order?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

// Calculate time constants outside of component render
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const t = await getTranslations("admin.users");
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const tierFilter = params.tier;
  const statusFilter = params.status;
  const perPage = parseInt(params.perPage || "20");
  const sort = params.sort || "createdAt";
  const order = (params.order || "desc") as "asc" | "desc";
  const fromDate = params.from;
  const toDate = params.to;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);

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
    ...(statusFilter ? { subscription: { status: statusFilter as SubscriptionStatus } } : {}),
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

  const [users, total, tierCounts, recentUsers, adminCount, subscriptionStatusCounts] = await Promise.all([
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
        subscription: {
          select: {
            status: true,
            trialEndsAt: true,
          },
        },
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
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.user.count({
      where: { deletedAt: null, isAdmin: true },
    }),
    // Exclude admin-managed subscriptions from status counts
    prisma.subscription.groupBy({
      by: ["status"],
      where: {
        NOT: { stripeSubscriptionId: { startsWith: "admin_" } },
      },
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const totalAllUsers = tierCounts.reduce((acc, t) => acc + t._count, 0);

  const basicCount = tierCounts.find((t) => t.subscriptionTier === "BASIC")?._count || 0;
  const plusCount = tierCounts.find((t) => t.subscriptionTier === "PLUS")?._count || 0;
  const completeCount = tierCounts.find((t) => t.subscriptionTier === "COMPLETE")?._count || 0;

  const trialingCount = subscriptionStatusCounts.find((s) => s.status === "TRIALING")?._count || 0;
  const pastDueCount = subscriptionStatusCounts.find((s) => s.status === "PAST_DUE")?._count || 0;

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

        <Card className="border-0 bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl">
                <UserPlus className="h-5 w-5 text-accent" />
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
                <p className="text-sm text-muted-foreground">{t("stats.plus")}</p>
                <p className="text-3xl font-bold">{plusCount + completeCount}</p>
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
            searchParams={{ tier: tierFilter, status: statusFilter, sort, order, from: fromDate, to: toDate }}
          />
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, status: statusFilter, sort, order }}
          />
        </div>
        <MobileScrollContainer>
          <Link href={`/admin/users${query ? `?q=${query}` : ""}${sort !== "createdAt" ? `${query ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!tierFilter && !statusFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
            >
              {t("filters.all")} ({totalAllUsers})
            </Badge>
          </Link>
          <Link href={`/admin/users?tier=BASIC${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={tierFilter === "BASIC" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
            >
              Basic ({basicCount})
            </Badge>
          </Link>
          <Link href={`/admin/users?tier=PLUS${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={tierFilter === "PLUS" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              Plus ({plusCount})
            </Badge>
          </Link>
          <Link href={`/admin/users?tier=COMPLETE${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={tierFilter === "COMPLETE" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30"
            >
              Complete ({completeCount})
            </Badge>
          </Link>
          <span className="text-muted-foreground mx-1">|</span>
          <Link href={`/admin/users?status=TRIALING${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "TRIALING" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
            >
              {t("filters.trialing")} ({trialingCount})
            </Badge>
          </Link>
          <Link href={`/admin/users?status=PAST_DUE${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "PAST_DUE" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
            >
              {t("filters.pastDue")} ({pastDueCount})
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
            searchParams={{ q: query, tier: tierFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.name")}
            sortKey="name"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.email")}
            sortKey="email"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.lastLogin")}
            sortKey="lastLoginAt"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.tier")}
            sortKey="tier"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/users"
            searchParams={{ q: query, tier: tierFilter, status: statusFilter, from: fromDate, to: toDate }}
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
          status: statusFilter,
          sort: sort !== "createdAt" ? sort : undefined,
          order: sort !== "createdAt" ? order : undefined,
          from: fromDate,
          to: toDate,
        }}
      />
    </div>
  );
}
