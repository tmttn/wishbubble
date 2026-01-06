import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users,
  Gift,
  Star,
  ExternalLink,
  ShoppingCart,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

interface WishlistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminWishlistDetailPage({
  params,
}: WishlistDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("admin.wishlistDetail");

  const wishlist = await prisma.wishlist.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, image: true },
      },
      items: {
        where: { deletedAt: null },
        include: {
          claims: {
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { claimedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      },
      bubbles: {
        where: { bubble: { archivedAt: null } },
        include: {
          bubble: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  if (!wishlist) notFound();

  const claimedItems = wishlist.items.filter((item) => item.claims.length > 0);
  const purchasedItems = wishlist.items.filter((item) =>
    item.claims.some((c) => c.status === "PURCHASED")
  );
  const totalValue = wishlist.items.reduce(
    (sum, item) => sum + (item.price ? Number(item.price) : 0),
    0
  );
  const defaultCurrency = wishlist.items[0]?.currency || "EUR";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/wishlists">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToWishlists")}
        </Link>
      </Button>

      {/* Wishlist header */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{wishlist.name}</h1>
                {wishlist.isDefault && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    <Star className="h-3 w-3 mr-1" />
                    {t("default")}
                  </Badge>
                )}
              </div>
              {wishlist.description && (
                <p className="text-muted-foreground mt-2">{wishlist.description}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("wishlistId")}</p>
                  <p className="font-mono text-xs">{wishlist.id}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">{t("totalItems")}</p>
                    <p>{wishlist.items.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">{t("created")}</p>
                    <p>{wishlist.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("totalValue")}</p>
                  <p>{defaultCurrency} {totalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-pink-500/10 to-pink-500/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-xl">
                <Gift className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.items")}</p>
                <p className="text-3xl font-bold">{wishlist.items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.claimed")}</p>
                <p className="text-3xl font-bold">{claimedItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Gift className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.purchased")}</p>
                <p className="text-3xl font-bold">{purchasedItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.sharedIn")}</p>
                <p className="text-3xl font-bold">{wishlist.bubbles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Owner */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t("owner")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/admin/users/${wishlist.user.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors w-fit"
          >
            <Avatar>
              <AvatarImage src={wishlist.user.image || wishlist.user.avatarUrl || undefined} />
              <AvatarFallback>
                {wishlist.user.name?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{wishlist.user.name || t("noName")}</p>
              <p className="text-sm text-muted-foreground">{wishlist.user.email}</p>
            </div>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shared in Bubbles */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("sharedInBubbles")} ({wishlist.bubbles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishlist.bubbles.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("notShared")}</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {wishlist.bubbles.map((bw) => (
                  <Link
                    key={bw.bubble.id}
                    href={`/admin/groups/${bw.bubble.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{bw.bubble.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {bw.bubble.slug}
                      </p>
                    </div>
                    <Badge variant={bw.isVisible ? "default" : "secondary"} className="text-xs">
                      {bw.isVisible ? t("visible") : t("hidden")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items summary by status */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {t("itemsSummary")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                <span className="text-sm">{t("unclaimed")}</span>
                <Badge variant="outline">{wishlist.items.length - claimedItems.length}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                <span className="text-sm">{t("reserved")}</span>
                <Badge variant="secondary">{claimedItems.length - purchasedItems.length}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                <span className="text-sm">{t("purchased")}</span>
                <Badge>{purchasedItems.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items list */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t("allItems")} ({wishlist.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wishlist.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noItems")}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {wishlist.items.map((item) => {
                const latestClaim = item.claims[0];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.priority === "MUST_HAVE" && (
                          <Badge variant="destructive" className="text-xs">
                            {t("highPriority")}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {item.price && (
                          <span>{item.currency} {Number(item.price).toFixed(2)}</span>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t("viewLink")}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {latestClaim ? (
                        <>
                          <Badge
                            variant={latestClaim.status === "PURCHASED" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {latestClaim.status === "PURCHASED" ? t("purchased") : t("reserved")}
                          </Badge>
                          <Link
                            href={`/admin/users/${latestClaim.user.id}`}
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            {t("by")} {latestClaim.user.name || t("unknown")}
                          </Link>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {t("unclaimed")}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
