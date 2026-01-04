import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Gift,
  Sparkles,
  Globe,
  TreePine,
  Heart,
  Cake,
  PartyPopper,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { OccasionType } from "@prisma/client";

interface GroupsPageProps {
  searchParams: Promise<{ q?: string; page?: string; type?: string }>;
}

const occasionIcons: Record<string, typeof Gift> = {
  CHRISTMAS: TreePine,
  BIRTHDAY: Cake,
  WEDDING: Heart,
  OTHER: PartyPopper,
};

const occasionColors: Record<string, string> = {
  CHRISTMAS: "from-red-500/10 to-green-500/10",
  BIRTHDAY: "from-pink-500/10 to-purple-500/10",
  WEDDING: "from-rose-500/10 to-amber-500/10",
  OTHER: "from-blue-500/10 to-cyan-500/10",
};

export default async function AdminGroupsPage({ searchParams }: GroupsPageProps) {
  const t = await getTranslations("admin.groups");
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const typeFilter = params.type;
  const perPage = 20;

  const where = {
    archivedAt: null,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { id: query },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(typeFilter ? { occasionType: typeFilter as OccasionType } : {}),
  };

  const [groups, total, occasionCounts, secretSantaCount, publicCount, upcomingEvents] = await Promise.all([
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
    prisma.bubble.groupBy({
      by: ["occasionType"],
      where: { archivedAt: null },
      _count: true,
    }),
    prisma.bubble.count({
      where: { archivedAt: null, isSecretSanta: true },
    }),
    prisma.bubble.count({
      where: { archivedAt: null, isPublic: true },
    }),
    prisma.bubble.count({
      where: {
        archivedAt: null,
        eventDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const totalAllGroups = occasionCounts.reduce((acc, t) => acc + t._count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("totalGroups", { count: totalAllGroups })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-rose-500/10 to-rose-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <Users className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
                <p className="text-3xl font-bold">{totalAllGroups.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <Sparkles className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.secretSanta")}</p>
                <p className="text-3xl font-bold">{secretSantaCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.public")}</p>
                <p className="text-3xl font-bold">{publicCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.upcomingEvents")}</p>
                <p className="text-3xl font-bold">{upcomingEvents}</p>
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
            name="q"
            placeholder={t("searchPlaceholder")}
            defaultValue={query}
            className="pl-10 bg-card/80 backdrop-blur-sm border-0"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/groups">
            <Badge
              variant={!typeFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("filters.all")} ({totalAllGroups})
            </Badge>
          </Link>
          {occasionCounts.map((oc) => (
            <Link key={oc.occasionType} href={`/admin/groups?type=${oc.occasionType}`}>
              <Badge
                variant={typeFilter === oc.occasionType ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {oc.occasionType} ({oc._count})
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Groups list */}
      <div className="grid gap-3">
        {groups.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("noGroupsFound")}</p>
            </CardContent>
          </Card>
        ) : (
          groups.map((group, index) => {
            const OccasionIcon = occasionIcons[group.occasionType] || Gift;
            const gradientClass = occasionColors[group.occasionType] || "from-gray-500/10 to-gray-500/5";
            const isUpcoming = group.eventDate && group.eventDate > new Date();
            const isPast = group.eventDate && group.eventDate < new Date();

            return (
              <Card
                key={group.id}
                className={`border-0 bg-gradient-to-r ${gradientClass} backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-background/50 group-hover:scale-105 transition-transform">
                      <OccasionIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/groups/${group.id}`}
                          className="font-medium truncate hover:text-primary transition-colors"
                        >
                          {group.name}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          {group.occasionType}
                        </Badge>
                        {group.isSecretSanta && (
                          <Badge
                            className={
                              group.secretSantaDrawn
                                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            }
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {group.secretSantaDrawn ? t("drawn") : t("secretSanta")}
                          </Badge>
                        )}
                        {group.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {t("public")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("owner")}:{" "}
                        <Link
                          href={`/admin/users/${group.owner.id}`}
                          className="hover:underline hover:text-foreground transition-colors"
                        >
                          {group.owner.name || group.owner.email}
                        </Link>
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{group._count.members}</p>
                        <p className="text-xs text-muted-foreground">{t("members")}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{group._count.wishlists}</p>
                        <p className="text-xs text-muted-foreground">{t("wishlists", { count: group._count.wishlists })}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{group._count.claims}</p>
                        <p className="text-xs text-muted-foreground">{t("claims", { count: group._count.claims })}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {group.eventDate && (
                        <div className={`flex items-center gap-1 mb-1 ${isUpcoming ? "text-green-600 dark:text-green-400" : isPast ? "text-muted-foreground" : ""}`}>
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{group.eventDate.toLocaleDateString()}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t("created", { date: group.createdAt.toLocaleDateString() })}
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
                <Link href={`/admin/groups?${typeFilter ? `type=${typeFilter}&` : ""}q=${query}&page=${page - 1}`}>
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
                <Link href={`/admin/groups?${typeFilter ? `type=${typeFilter}&` : ""}q=${query}&page=${page + 1}`}>
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
