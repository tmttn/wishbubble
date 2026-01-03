import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface ItemsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminItemsPage({ searchParams }: ItemsPageProps) {
  const t = await getTranslations("admin.items");
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
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
  };

  const [items, total] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("totalItems", { count: total })}
        </p>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder={t("searchPlaceholder")}
          className="flex-1 px-4 py-2 rounded-lg bg-background border border-border"
        />
        <Button type="submit">{t("search")}</Button>
      </form>

      {/* Items list */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("noItemsFound")}
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              className="border-0 bg-card/80 backdrop-blur-sm"
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{item.title}</p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
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
                        className="hover:underline"
                      >
                        {t("owner")}: {item.wishlist.user.name || item.wishlist.user.email}
                      </Link>
                      <span className="text-muted-foreground/70">|</span>
                      <Link
                        href={`/admin/items?search=${encodeURIComponent(item.wishlist.name)}`}
                        className="hover:underline"
                      >
                        {t("wishlist")}: {item.wishlist.name}
                        {item.wishlist.isDefault && ` (${t("default")})`}
                      </Link>
                      {item.price && (
                        <>
                          <span className="text-muted-foreground/70">|</span>
                          <span>
                            {item.currency} {Number(item.price).toFixed(2)}
                          </span>
                        </>
                      )}
                      <span className="text-muted-foreground/70">|</span>
                      <span>
                        {t("priority")}: {item.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {item.claims.length > 0 ? (
                      item.claims.map((claim) => (
                        <Badge
                          key={claim.id}
                          variant={claim.status === "PURCHASED" ? "default" : "secondary"}
                        >
                          {claim.status} {t("by")}{" "}
                          <Link
                            href={`/admin/users/${claim.user.id}`}
                            className="hover:underline ml-1"
                          >
                            {claim.user.name || t("unknown")}
                          </Link>
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{t("unclaimed")}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {item.createdAt.toLocaleDateString()}
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
                  href={`/admin/items?${search ? `search=${search}&` : ""}page=${page - 1}`}
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
                  href={`/admin/items?${search ? `search=${search}&` : ""}page=${page + 1}`}
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
