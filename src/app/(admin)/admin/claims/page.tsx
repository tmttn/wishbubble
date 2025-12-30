import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface ClaimsPageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminClaimsPage({ searchParams }: ClaimsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const statusFilter = params.status;
  const perPage = 25;

  const where = statusFilter ? { status: statusFilter as "CLAIMED" | "PURCHASED" } : {};

  const [claims, total, claimStats] = await Promise.all([
    prisma.claim.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        item: {
          select: {
            id: true,
            title: true,
            url: true,
            price: true,
            wishlist: {
              select: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        bubble: { select: { id: true, name: true } },
      },
      orderBy: { claimedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.claim.count({ where }),
    prisma.claim.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const claimedCount = claimStats.find((s) => s.status === "CLAIMED")?._count || 0;
  const purchasedCount = claimStats.find((s) => s.status === "PURCHASED")?._count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Claims</h1>
        <p className="text-muted-foreground mt-1">
          {total} total claims ({claimedCount} claimed, {purchasedCount} purchased)
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        <Link href="/admin/claims">
          <Badge
            variant={!statusFilter ? "default" : "outline"}
            className="cursor-pointer"
          >
            All ({claimedCount + purchasedCount})
          </Badge>
        </Link>
        <Link href="/admin/claims?status=CLAIMED">
          <Badge
            variant={statusFilter === "CLAIMED" ? "default" : "outline"}
            className="cursor-pointer"
          >
            Claimed ({claimedCount})
          </Badge>
        </Link>
        <Link href="/admin/claims?status=PURCHASED">
          <Badge
            variant={statusFilter === "PURCHASED" ? "default" : "outline"}
            className="cursor-pointer"
          >
            Purchased ({purchasedCount})
          </Badge>
        </Link>
      </div>

      {/* Claims list */}
      <div className="space-y-2">
        {claims.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              No claims found
            </CardContent>
          </Card>
        ) : (
          claims.map((claim) => (
            <Card
              key={claim.id}
              className="border-0 bg-card/80 backdrop-blur-sm"
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{claim.item.title}</p>
                      {claim.item.url && (
                        <a
                          href={claim.item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span>
                        Claimed by:{" "}
                        <Link
                          href={`/admin/users/${claim.user.id}`}
                          className="hover:underline text-foreground"
                        >
                          {claim.user.name || claim.user.email}
                        </Link>
                      </span>
                      <span>
                        For:{" "}
                        <Link
                          href={`/admin/users/${claim.item.wishlist.user.id}`}
                          className="hover:underline text-foreground"
                        >
                          {claim.item.wishlist.user.name || claim.item.wishlist.user.email}
                        </Link>
                      </span>
                      <span>
                        In:{" "}
                        <Link
                          href={`/admin/groups/${claim.bubble.id}`}
                          className="hover:underline text-foreground"
                        >
                          {claim.bubble.name}
                        </Link>
                      </span>
                      {claim.item.price && (
                        <span>${Number(claim.item.price).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={claim.status === "PURCHASED" ? "default" : "secondary"}
                    >
                      {claim.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {claim.claimedAt.toLocaleDateString()}
                    </span>
                    {claim.purchasedAt && (
                      <span className="text-xs text-muted-foreground">
                        Purchased: {claim.purchasedAt.toLocaleDateString()}
                      </span>
                    )}
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
                  href={`/admin/claims?${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}
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
                  href={`/admin/claims?${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}
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
