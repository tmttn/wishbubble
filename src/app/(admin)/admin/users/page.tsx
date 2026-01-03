import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

interface UsersPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const t = await getTranslations("admin.users");
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const perPage = 20;

  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
          { id: query },
        ],
        deletedAt: null,
      }
    : { deletedAt: null };

  const [users, total] = await Promise.all([
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("totalUsers", { count: total })}</p>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          placeholder={t("searchPlaceholder")}
          defaultValue={query}
          className="pl-10"
        />
      </form>

      {/* Users list */}
      <div className="grid gap-3">
        {users.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("noUsersFound")}
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Link key={user.id} href={`/admin/users/${user.id}`}>
              <Card className="border-0 bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage
                        src={user.image || user.avatarUrl || undefined}
                      />
                      <AvatarFallback>
                        {user.name?.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {user.name || t("noName")}
                        </p>
                        {user.isAdmin && (
                          <Badge variant="destructive" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="hidden md:block text-right text-sm text-muted-foreground">
                      <p>{t("groups", { count: user._count.bubbleMemberships })}</p>
                      <p>{t("wishlists", { count: user._count.wishlists })}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{user.subscriptionTier}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.lastLoginAt
                          ? t("lastLogin", { date: user.lastLoginAt.toLocaleDateString() })
                          : t("neverLoggedIn")}
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
                <Link href={`/admin/users?q=${query}&page=${page - 1}`}>
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
                <Link href={`/admin/users?q=${query}&page=${page + 1}`}>
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
