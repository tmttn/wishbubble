import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gift,
  Search,
  ShoppingCart,
  Tag,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

interface ItemsPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function AdminItemsPage({ searchParams }: ItemsPageProps) {
  const t = await getTranslations("admin.items");
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const statusFilter = params.status;
  const perPage = 25;

  const where = {
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
  };

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
      orderBy: { createdAt: "desc" },
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
      <div className="flex flex-col sm:flex-row gap-4">
        <form className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            name="search"
            defaultValue={search}
            placeholder={t("searchPlaceholder")}
            className="pl-10 bg-card/80 backdrop-blur-sm border-0"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/items">
            <Badge
              variant={!statusFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.all")} ({totalAllItems})
            </Badge>
          </Link>
          <Link href="/admin/items?status=claimed">
            <Badge
              variant={statusFilter === "claimed" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
            >
              {t("filters.claimed")} ({claimedCount})
            </Badge>
          </Link>
          <Link href="/admin/items?status=unclaimed">
            <Badge
              variant={statusFilter === "unclaimed" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.unclaimed")} ({unclaimedCount})
            </Badge>
          </Link>
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
                <Link
                  href={`/admin/items?${search ? `search=${search}&` : ""}${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}
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
              className="bg-card/80 backdrop-blur-sm border-0"
            >
              {page < totalPages ? (
                <Link
                  href={`/admin/items?${search ? `search=${search}&` : ""}${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}
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
