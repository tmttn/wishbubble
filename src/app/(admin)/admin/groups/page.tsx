import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Calendar,
  Sparkles,
  Globe,
  Archive,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { OccasionType, Prisma } from "@prisma/client";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter, MobileScrollContainer } from "@/components/admin";
import { GroupsListClient } from "@/components/admin/groups-list-client";

interface GroupsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    type?: string;
    status?: string;
    sort?: string;
    order?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

// Calculate time constants outside of component render
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function AdminGroupsPage({ searchParams }: GroupsPageProps) {
  const t = await getTranslations("admin.groups");
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const typeFilter = params.type;
  const statusFilter = params.status;
  const perPage = parseInt(params.perPage || "20");
  const sort = params.sort || "createdAt";
  const order = (params.order || "desc") as "asc" | "desc";
  const fromDate = params.from;
  const toDate = params.to;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + THIRTY_DAYS_MS);

  // Build where clause based on status filter (default to active/non-archived)
  const archivedFilter = statusFilter === "archived"
    ? { archivedAt: { not: null } }
    : statusFilter === "all"
    ? {} // "all" shows everything
    : { archivedAt: null }; // default: hide archived

  const where: Prisma.BubbleWhereInput = {
    ...archivedFilter,
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
  const orderBy: Prisma.BubbleOrderByWithRelationInput = {};
  if (sort === "name") {
    orderBy.name = order;
  } else if (sort === "eventDate") {
    orderBy.eventDate = order;
  } else if (sort === "members") {
    orderBy.members = { _count: order };
  } else {
    orderBy.createdAt = order;
  }

  const [groups, total, occasionCounts, secretSantaCount, publicCount, upcomingEvents, archivedCount, activeCount] = await Promise.all([
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
        archivedAt: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, wishlists: true, claims: true },
        },
      },
      orderBy,
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
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    }),
    prisma.bubble.count({
      where: { archivedAt: { not: null } },
    }),
    prisma.bubble.count({
      where: { archivedAt: null },
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <AdminSearch
            placeholder={t("searchPlaceholder")}
            defaultValue={query}
            baseUrl="/admin/groups"
            searchParams={{ type: typeFilter, sort, order, from: fromDate, to: toDate }}
          />
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/groups"
            searchParams={{ q: query, type: typeFilter, sort, order }}
          />
        </div>
        {/* Status filters */}
        <MobileScrollContainer>
          <Link href={`/admin/groups${query ? `?q=${query}` : ""}${typeFilter ? `${query ? "&" : "?"}type=${typeFilter}` : ""}${sort !== "createdAt" ? `${query || typeFilter ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!statusFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
            >
              {t("filters.active")} ({activeCount})
            </Badge>
          </Link>
          <Link href={`/admin/groups?status=archived${query ? `&q=${query}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "archived" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap bg-gray-500/10 hover:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30"
            >
              <Archive className="h-3 w-3 mr-1" />
              {t("filters.archived")} ({archivedCount})
            </Badge>
          </Link>
          <Link href={`/admin/groups?status=all${query ? `&q=${query}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "all" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
            >
              {t("filters.all")} ({activeCount + archivedCount})
            </Badge>
          </Link>
        </MobileScrollContainer>
        {/* Occasion type filters */}
        <MobileScrollContainer>
          <Link href={`/admin/groups${query ? `?q=${query}` : ""}${statusFilter ? `${query ? "&" : "?"}status=${statusFilter}` : ""}${sort !== "createdAt" ? `${query || statusFilter ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!typeFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
            >
              {t("filters.allTypes")} ({totalAllGroups})
            </Badge>
          </Link>
          {occasionCounts.map((oc) => (
            <Link key={oc.occasionType} href={`/admin/groups?type=${oc.occasionType}${query ? `&q=${query}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
              <Badge
                variant={typeFilter === oc.occasionType ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap"
              >
                {oc.occasionType} ({oc._count})
              </Badge>
            </Link>
          ))}
        </MobileScrollContainer>
        {/* Sort options */}
        <MobileScrollContainer className="items-center text-sm">
          <span className="text-muted-foreground shrink-0">{t("sortBy")}:</span>
          <AdminSortHeader
            label={t("sortOptions.createdAt")}
            sortKey="createdAt"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/groups"
            searchParams={{ q: query, type: typeFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.name")}
            sortKey="name"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/groups"
            searchParams={{ q: query, type: typeFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.eventDate")}
            sortKey="eventDate"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/groups"
            searchParams={{ q: query, type: typeFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
          <AdminSortHeader
            label={t("sortOptions.members")}
            sortKey="members"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/groups"
            searchParams={{ q: query, type: typeFilter, status: statusFilter, from: fromDate, to: toDate }}
            className="whitespace-nowrap"
          />
        </MobileScrollContainer>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t("noGroupsFound")}</p>
          </CardContent>
        </Card>
      ) : (
        <GroupsListClient
          groups={groups}
          labels={{
            owner: t("owner"),
            members: t("members"),
            wishlists: t("wishlists", { count: 0 }).replace("0", "").trim(),
            claims: t("claims", { count: 0 }).replace("0", "").trim(),
            secretSanta: t("secretSanta"),
            drawn: t("drawn"),
            public: t("public"),
            archived: t("archived"),
            created: t("created", { date: "{date}" }),
          }}
        />
      )}

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        baseUrl="/admin/groups"
        searchParams={{
          q: query,
          type: typeFilter,
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
