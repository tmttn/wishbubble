import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Users, Calendar } from "lucide-react";

interface GroupsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminGroupsPage({ searchParams }: GroupsPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const perPage = 20;

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { id: query },
          { slug: { contains: query, mode: "insensitive" as const } },
        ],
        archivedAt: null,
      }
    : { archivedAt: null };

  const [groups, total] = await Promise.all([
    prisma.bubble.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        occasionType: true,
        eventDate: true,
        isSecretSanta: true,
        secretSantaDrawn: true,
        isPublic: true,
        createdAt: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, wishlists: true, claims: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.bubble.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Groups</h1>
        <p className="text-muted-foreground mt-1">{total} total groups</p>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          placeholder="Search by name, slug, or ID..."
          defaultValue={query}
          className="pl-10"
        />
      </form>

      {/* Groups list */}
      <div className="grid gap-3">
        {groups.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              No groups found
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Link key={group.id} href={`/admin/groups/${group.id}`}>
              <Card className="border-0 bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{group.name}</p>
                        <Badge variant="outline">{group.occasionType}</Badge>
                        {group.isSecretSanta && (
                          <Badge
                            variant={
                              group.secretSantaDrawn ? "default" : "secondary"
                            }
                          >
                            {group.secretSantaDrawn
                              ? "Drawn"
                              : "Secret Santa"}
                          </Badge>
                        )}
                        {group.isPublic && (
                          <Badge variant="secondary">Public</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Owner:{" "}
                        <Link
                          href={`/admin/users/${group.owner.id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {group.owner.name || group.owner.email}
                        </Link>
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group._count.members}
                      </div>
                      <div>{group._count.wishlists} wishlists</div>
                      <div>{group._count.claims} claims</div>
                    </div>
                    <div className="text-right text-sm">
                      {group.eventDate && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {group.eventDate.toLocaleDateString()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {group.createdAt.toLocaleDateString()}
                      </p>
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
                <Link href={`/admin/groups?q=${query}&page=${page - 1}`}>
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
                <Link href={`/admin/groups?q=${query}&page=${page + 1}`}>
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
