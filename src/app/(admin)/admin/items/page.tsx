import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ExternalLink,
  Gift,
  ShoppingCart,
  Tag,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter } from "@/components/admin";

interface ItemsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    sort?: string;
    order?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminItemsPage({ searchParams }: ItemsPageProps) {
  const t = await getTranslations("admin.items");
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const statusFilter = params.status;
  const perPage = parseInt(params.perPage || "25");
  const sort = params.sort || "createdAt";
  const order = (params.order || "desc") as "asc" | "desc";
  const fromDate = params.from;
  const toDate = params.to;

  // Build where clause
  const where: Prisma.WishlistItemWhereInput = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(statusFilter === "claimed"
      ? { claims: { some: {} } }
      : statusFilter === "unclaimed"
      ? { claims: { none: {} } }
      : {}),
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
  const orderBy: Prisma.WishlistItemOrderByWithRelationInput = {};
  if (sort === "title") {
    orderBy.title = order;
  } else if (sort === "price") {
    orderBy.price = order;
  } else {
    orderBy.createdAt = order;
  }

  const [items, total, claimedCount, totalValue, recentItems] = await Promise.all([
    prisma.wishlistItem.findMany({
      where,
      include: {
        wishlist: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        claims: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.wishlistItem.count({ where }),
    prisma.wishlistItem.count({
      where: { deletedAt: null, claims: { some: {} } },
    }),
    prisma.wishlistItem.aggregate({
      where: { deletedAt: null, price: { not: null } },
      _sum: { price: true },
    }),
    prisma.wishlistItem.count({
      where: {
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const totalAllItems = await prisma.wishlistItem.count({ where: { deletedAt: null } });
  const unclaimedCount = totalAllItems - claimedCount;
  const totalValueNum = totalValue._sum.price ? Number(totalValue._sum.price) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("totalItems", { count: totalAllItems })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Gift className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
                <p className="text-3xl font-bold">{totalAllItems.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.claimed")}</p>
                <p className="text-3xl font-bold">{claimedCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.totalValue")}</p>
                <p className="text-3xl font-bold">{totalValueNum.toLocaleString(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
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
                <p className="text-sm text-muted-foreground">{t("stats.newThisWeek")}</p>
                <p className="text-3xl font-bold">{recentItems}</p>
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
            defaultValue={search}
            paramName="search"
            baseUrl="/admin/items"
            searchParams={{ status: statusFilter, sort, order, from: fromDate, to: toDate }}
          />
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/items"
            searchParams={{ search, status: statusFilter, sort, order }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/admin/items${search ? `?search=${search}` : ""}${sort !== "createdAt" ? `${search ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!statusFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.all")} ({totalAllItems})
            </Badge>
          </Link>
          <Link href={`/admin/items?status=claimed${search ? `&search=${search}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "claimed" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
            >
              {t("filters.claimed")} ({claimedCount})
            </Badge>
          </Link>
          <Link href={`/admin/items?status=unclaimed${search ? `&search=${search}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "unclaimed" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.unclaimed")} ({unclaimedCount})
            </Badge>
          </Link>
        </div>
        {/* Sort options */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{t("sortBy")}:</span>
          <AdminSortHeader
            label={t("sortOptions.createdAt")}
            sortKey="createdAt"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/items"
            searchParams={{ search, status: statusFilter, from: fromDate, to: toDate }}
          />
          <AdminSortHeader
            label={t("sortOptions.title")}
            sortKey="title"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/items"
            searchParams={{ search, status: statusFilter, from: fromDate, to: toDate }}
          />
          <AdminSortHeader
            label={t("sortOptions.price")}
            sortKey="price"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/items"
            searchParams={{ search, status: statusFilter, from: fromDate, to: toDate }}
          />
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("noItemsFound")}</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item, index) => {
            const isClaimed = item.claims.length > 0;
            const isPurchased = item.claims.some((c) => c.status === "PURCHASED");

            return (
              <Card
                key={item.id}
                className={`border-0 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group ${
                  isPurchased
                    ? "bg-gradient-to-r from-green-500/10 to-green-500/5"
                    : isClaimed
                    ? "bg-gradient-to-r from-blue-500/10 to-blue-500/5"
                    : "bg-card/80"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {item.priority === "MUST_HAVE" && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                            <Tag className="h-3 w-3 mr-1" />
                            {t("highPriority")}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <Link
                          href={`/admin/users/${item.wishlist.user.id}`}
                          className="hover:underline hover:text-foreground transition-colors"
                        >
                          {t("owner")}: {item.wishlist.user.name || item.wishlist.user.email}
                        </Link>
                        <span className="text-muted-foreground/50">|</span>
                        <span>
                          {t("wishlist")}: {item.wishlist.name}
                          {item.wishlist.isDefault && ` (${t("default")})`}
                        </span>
                        {item.price && (
                          <>
                            <span className="text-muted-foreground/50">|</span>
                            <span className="font-medium text-foreground">
                              {item.currency} {Number(item.price).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.claims.length > 0 ? (
                        item.claims.map((claim) => (
                          <Badge
                            key={claim.id}
                            className={
                              claim.status === "PURCHASED"
                                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            }
                          >
                            {claim.status === "PURCHASED" ? (
                              <ShoppingCart className="h-3 w-3 mr-1" />
                            ) : null}
                            {claim.status}{" "}
                            <Link
                              href={`/admin/users/${claim.user.id}`}
                              className="hover:underline ml-1"
                            >
                              {claim.user.name || t("unknown")}
                            </Link>
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          {t("unclaimed")}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {item.createdAt.toLocaleDateString()}
                      </span>
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
        baseUrl="/admin/items"
        searchParams={{
          search,
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
