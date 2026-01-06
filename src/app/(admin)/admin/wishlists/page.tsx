import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Heart,
  Gift,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter } from "@/components/admin";

interface WishlistsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
    sort?: string;
    order?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminWishlistsPage({ searchParams }: WishlistsPageProps) {
  const t = await getTranslations("admin.wishlists");
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const typeFilter = params.type;
  const perPage = parseInt(params.perPage || "20");
  const sort = params.sort || "createdAt";
  const order = (params.order || "desc") as "asc" | "desc";
  const fromDate = params.from;
  const toDate = params.to;

  // Build where clause
  const where: Prisma.WishlistWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(typeFilter === "default"
      ? { isDefault: true }
      : typeFilter === "custom"
      ? { isDefault: false }
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
  const orderBy: Prisma.WishlistOrderByWithRelationInput = {};
  if (sort === "name") {
    orderBy.name = order;
  } else if (sort === "items") {
    orderBy.items = { _count: order };
  } else {
    orderBy.createdAt = order;
  }

  const [wishlists, total, defaultCount, totalItems, recentWishlists, sharedCount] = await Promise.all([
    prisma.wishlist.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          where: { deletedAt: null },
          select: { id: true },
        },
        bubbles: {
          where: { bubble: { archivedAt: null } },
          select: { bubble: { select: { id: true, name: true } } },
        },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.wishlist.count({ where }),
    prisma.wishlist.count({ where: { isDefault: true } }),
    prisma.wishlistItem.count({ where: { deletedAt: null } }),
    prisma.wishlist.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.wishlist.count({
      where: {
        bubbles: { some: {} },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const totalAllWishlists = await prisma.wishlist.count();
  const customCount = totalAllWishlists - defaultCount;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("totalWishlists", { count: totalAllWishlists })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-pink-500/10 to-pink-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-xl">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
                <p className="text-3xl font-bold">{totalAllWishlists.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Gift className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.totalItems")}</p>
                <p className="text-3xl font-bold">{totalItems.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.shared")}</p>
                <p className="text-3xl font-bold">{sharedCount.toLocaleString()}</p>
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
                <p className="text-3xl font-bold">{recentWishlists}</p>
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
            baseUrl="/admin/wishlists"
            searchParams={{ type: typeFilter, sort, order, from: fromDate, to: toDate }}
          />
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/wishlists"
            searchParams={{ search, type: typeFilter, sort, order }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/admin/wishlists${search ? `?search=${search}` : ""}${sort !== "createdAt" ? `${search ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!typeFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.all")} ({totalAllWishlists})
            </Badge>
          </Link>
          <Link href={`/admin/wishlists?type=default${search ? `&search=${search}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={typeFilter === "default" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              <Star className="h-3 w-3 mr-1" />
              {t("filters.default")} ({defaultCount})
            </Badge>
          </Link>
          <Link href={`/admin/wishlists?type=custom${search ? `&search=${search}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={typeFilter === "custom" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.custom")} ({customCount})
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
            baseUrl="/admin/wishlists"
            searchParams={{ search, type: typeFilter, from: fromDate, to: toDate }}
          />
          <AdminSortHeader
            label={t("sortOptions.name")}
            sortKey="name"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/wishlists"
            searchParams={{ search, type: typeFilter, from: fromDate, to: toDate }}
          />
          <AdminSortHeader
            label={t("sortOptions.items")}
            sortKey="items"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/wishlists"
            searchParams={{ search, type: typeFilter, from: fromDate, to: toDate }}
          />
        </div>
      </div>

      {/* Wishlists list */}
      <div className="space-y-3">
        {wishlists.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("noWishlistsFound")}</p>
            </CardContent>
          </Card>
        ) : (
          wishlists.map((wishlist, index) => {
            const itemCount = wishlist.items.length;
            const bubbleCount = wishlist.bubbles.length;

            return (
              <Card
                key={wishlist.id}
                className={`border-0 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group ${
                  wishlist.isDefault
                    ? "bg-gradient-to-r from-amber-500/10 to-amber-500/5"
                    : "bg-card/80"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/wishlists/${wishlist.id}`}
                          className="font-medium truncate group-hover:text-primary transition-colors hover:underline"
                        >
                          {wishlist.name}
                        </Link>
                        {wishlist.isDefault && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                            <Star className="h-3 w-3 mr-1" />
                            {t("default")}
                          </Badge>
                        )}
                      </div>
                      {wishlist.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {wishlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <Link
                          href={`/admin/users/${wishlist.user.id}`}
                          className="hover:underline hover:text-foreground transition-colors"
                        >
                          {t("owner")}: {wishlist.user.name || wishlist.user.email}
                        </Link>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {t("itemCount", { count: itemCount })}
                        </span>
                        {bubbleCount > 0 && (
                          <>
                            <span className="text-muted-foreground/50">|</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {t("sharedIn", { count: bubbleCount })}
                            </span>
                          </>
                        )}
                      </div>
                      {bubbleCount > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {wishlist.bubbles.slice(0, 3).map((bw) => (
                            <Link
                              key={bw.bubble.id}
                              href={`/admin/groups/${bw.bubble.id}`}
                              className="text-xs bg-muted px-2 py-1 rounded-full hover:bg-muted/80 transition-colors"
                            >
                              {bw.bubble.name}
                            </Link>
                          ))}
                          {bubbleCount > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{bubbleCount - 3} {t("more")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {wishlist.createdAt.toLocaleDateString()}
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
        baseUrl="/admin/wishlists"
        searchParams={{
          search,
          type: typeFilter,
          sort: sort !== "createdAt" ? sort : undefined,
          order: sort !== "createdAt" ? order : undefined,
          from: fromDate,
          to: toDate,
        }}
      />
    </div>
  );
}
