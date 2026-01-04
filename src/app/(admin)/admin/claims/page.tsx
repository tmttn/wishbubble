import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Package,
  TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter } from "@/components/admin";

interface ClaimsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
    sort?: string;
    order?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminClaimsPage({ searchParams }: ClaimsPageProps) {
  const t = await getTranslations("admin.claimsPage");
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const statusFilter = params.status;
  const query = params.q || "";
  const perPage = parseInt(params.perPage || "25");
  const sort = params.sort || "claimedAt";
  const order = (params.order || "desc") as "asc" | "desc";
  const fromDate = params.from;
  const toDate = params.to;

  // Build where clause
  const where: Prisma.ClaimWhereInput = {
    ...(statusFilter ? { status: statusFilter as "CLAIMED" | "PURCHASED" } : {}),
    ...(query
      ? {
          OR: [
            { item: { title: { contains: query, mode: "insensitive" as const } } },
            { user: { name: { contains: query, mode: "insensitive" as const } } },
            { user: { email: { contains: query, mode: "insensitive" as const } } },
            { bubble: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(fromDate || toDate
      ? {
          claimedAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  };

  // Build orderBy clause
  const orderBy: Prisma.ClaimOrderByWithRelationInput = {};
  if (sort === "status") {
    orderBy.status = order;
  } else {
    orderBy.claimedAt = order;
  }

  const [claims, total, statusCounts, recentClaims] = await Promise.all([
    prisma.claim.findMany({
      where,
      include: {
        item: {
          include: {
            wishlist: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        bubble: { select: { id: true, name: true } },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.claim.count({ where }),
    prisma.claim.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.claim.count({
      where: {
        claimedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const claimedCount = statusCounts.find((s) => s.status === "CLAIMED")?._count || 0;
  const purchasedCount = statusCounts.find((s) => s.status === "PURCHASED")?._count || 0;
  const totalAll = statusCounts.reduce((acc, s) => acc + s._count, 0);

  const statusIcons: Record<string, typeof Clock> = {
    CLAIMED: Clock,
    PURCHASED: CheckCircle,
  };

  const statusColors: Record<string, string> = {
    CLAIMED: "from-blue-500/10 to-blue-500/5",
    PURCHASED: "from-green-500/10 to-green-500/5",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("summary", { total: totalAll, claimed: claimedCount, purchased: purchasedCount })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <Package className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
                <p className="text-3xl font-bold">{totalAll.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.claimed")}</p>
                <p className="text-3xl font-bold">{claimedCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.purchased")}</p>
                <p className="text-3xl font-bold">{purchasedCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.newThisWeek")}</p>
                <p className="text-3xl font-bold">{recentClaims}</p>
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
            baseUrl="/admin/claims"
            searchParams={{ status: statusFilter, sort, order, from: fromDate, to: toDate }}
          />
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/claims"
            searchParams={{ q: query, status: statusFilter, sort, order }}
          />
        </div>
        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          <Link href={`/admin/claims${query ? `?q=${query}` : ""}${sort !== "claimedAt" ? `${query ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!statusFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("all")} ({totalAll})
            </Badge>
          </Link>
          <Link href={`/admin/claims?status=CLAIMED${query ? `&q=${query}` : ""}${sort !== "claimedAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "CLAIMED" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
            >
              <Clock className="h-3 w-3 mr-1" />
              {t("claimed")} ({claimedCount})
            </Badge>
          </Link>
          <Link href={`/admin/claims?status=PURCHASED${query ? `&q=${query}` : ""}${sort !== "claimedAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "PURCHASED" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("purchased")} ({purchasedCount})
            </Badge>
          </Link>
        </div>
        {/* Sort options */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{t("sortBy")}:</span>
          <AdminSortHeader
            label={t("sortOptions.claimedAt")}
            sortKey="claimedAt"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/claims"
            searchParams={{ q: query, status: statusFilter, from: fromDate, to: toDate }}
          />
          <AdminSortHeader
            label={t("sortOptions.status")}
            sortKey="status"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/claims"
            searchParams={{ q: query, status: statusFilter, from: fromDate, to: toDate }}
          />
        </div>
      </div>

      {/* Claims list */}
      <div className="space-y-3">
        {claims.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("noClaimsFound")}</p>
            </CardContent>
          </Card>
        ) : (
          claims.map((claim, index) => {
            const StatusIcon = statusIcons[claim.status] || Package;
            const gradientClass = statusColors[claim.status] || "from-gray-500/10 to-gray-500/5";

            return (
              <Card
                key={claim.id}
                className={`border-0 bg-gradient-to-r ${gradientClass} backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-background/50 group-hover:scale-105 transition-transform ${
                      claim.status === "PURCHASED" ? "text-green-500" : "text-blue-500"
                    }`}>
                      <StatusIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {claim.item.title}
                        </p>
                        <Badge
                          className={
                            claim.status === "PURCHASED"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                          }
                        >
                          {claim.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span>
                          {t("claimedBy")}:{" "}
                          <Link
                            href={`/admin/users/${claim.user.id}`}
                            className="hover:underline hover:text-foreground transition-colors font-medium"
                          >
                            {claim.user.name || claim.user.email}
                          </Link>
                        </span>
                        <span className="text-muted-foreground/50">→</span>
                        <span>
                          {t("for")}:{" "}
                          <Link
                            href={`/admin/users/${claim.item.wishlist.user.id}`}
                            className="hover:underline hover:text-foreground transition-colors font-medium"
                          >
                            {claim.item.wishlist.user.name || claim.item.wishlist.user.email}
                          </Link>
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <Link
                          href={`/admin/groups/${claim.bubble.id}`}
                          className="font-medium hover:underline hover:text-primary transition-colors"
                        >
                          {claim.bubble.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{t("inBubble")}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        {claim.claimedAt.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {claim.claimedAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        baseUrl="/admin/claims"
        searchParams={{
          q: query,
          status: statusFilter,
          sort: sort !== "claimedAt" ? sort : undefined,
          order: sort !== "claimedAt" ? order : undefined,
          from: fromDate,
          to: toDate,
        }}
      />
    </div>
  );
}
