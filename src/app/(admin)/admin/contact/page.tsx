import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, Ban } from "lucide-react";
import { ContactStatus, Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { AdminPagination, AdminSearch, AdminSortHeader, AdminDateFilter } from "@/components/admin";

interface ContactPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
    q?: string;
    sort?: string;
    order?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

const statusColors: Record<ContactStatus, string> = {
  NEW: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  RESOLVED: "bg-green-500",
  SPAM: "bg-red-500",
};

const statusIcons: Record<ContactStatus, React.ReactNode> = {
  NEW: <AlertCircle className="h-4 w-4" />,
  IN_PROGRESS: <Clock className="h-4 w-4" />,
  RESOLVED: <CheckCircle className="h-4 w-4" />,
  SPAM: <Ban className="h-4 w-4" />,
};

export default async function AdminContactPage({ searchParams }: ContactPageProps) {
  const t = await getTranslations("admin.contactPage");
  const params = await searchParams;
  const statusFilter = params.status as ContactStatus | undefined;
  const page = parseInt(params.page || "1");
  const query = params.q || "";
  const perPage = parseInt(params.perPage || "20");
  const sort = params.sort || "createdAt";
  const order = (params.order || "desc") as "asc" | "desc";
  const fromDate = params.from;
  const toDate = params.to;

  // Build where clause
  const where: Prisma.ContactSubmissionWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { message: { contains: query, mode: "insensitive" as const } },
          ],
        }
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
  const orderBy: Prisma.ContactSubmissionOrderByWithRelationInput = {};
  if (sort === "name") {
    orderBy.name = order;
  } else if (sort === "status") {
    orderBy.status = order;
  } else {
    orderBy.createdAt = order;
  }

  const [submissions, total, statusCounts] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contactSubmission.count({ where }),
    prisma.contactSubmission.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const counts = {
    NEW: statusCounts.find((s) => s.status === "NEW")?._count.status || 0,
    IN_PROGRESS: statusCounts.find((s) => s.status === "IN_PROGRESS")?._count.status || 0,
    RESOLVED: statusCounts.find((s) => s.status === "RESOLVED")?._count.status || 0,
    SPAM: statusCounts.find((s) => s.status === "SPAM")?._count.status || 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("totalSubmissions", { count: total })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("new")}</p>
                <p className="text-3xl font-bold">{counts.NEW}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("inProgress")}</p>
                <p className="text-3xl font-bold">{counts.IN_PROGRESS}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("resolved")}</p>
                <p className="text-3xl font-bold">{counts.RESOLVED}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <Ban className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("spam")}</p>
                <p className="text-3xl font-bold">{counts.SPAM}</p>
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
            baseUrl="/admin/contact"
            searchParams={{ status: statusFilter, sort, order, from: fromDate, to: toDate }}
          />
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/contact"
            searchParams={{ q: query, status: statusFilter, sort, order }}
          />
        </div>
        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/contact${query ? `?q=${query}` : ""}${sort !== "createdAt" ? `${query ? "&" : "?"}sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={!statusFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("all")} ({counts.NEW + counts.IN_PROGRESS + counts.RESOLVED + counts.SPAM})
            </Badge>
          </Link>
          <Link href={`/admin/contact?status=NEW${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "NEW" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {t("new")} ({counts.NEW})
            </Badge>
          </Link>
          <Link href={`/admin/contact?status=IN_PROGRESS${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "IN_PROGRESS" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              <Clock className="h-3 w-3 mr-1" />
              {t("inProgress")} ({counts.IN_PROGRESS})
            </Badge>
          </Link>
          <Link href={`/admin/contact?status=RESOLVED${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "RESOLVED" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("resolved")} ({counts.RESOLVED})
            </Badge>
          </Link>
          <Link href={`/admin/contact?status=SPAM${query ? `&q=${query}` : ""}${sort !== "createdAt" ? `&sort=${sort}&order=${order}` : ""}`}>
            <Badge
              variant={statusFilter === "SPAM" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
            >
              <Ban className="h-3 w-3 mr-1" />
              {t("spam")} ({counts.SPAM})
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
            baseUrl="/admin/contact"
            searchParams={{ q: query, status: statusFilter, from: fromDate, to: toDate }}
          />
          <AdminSortHeader
            label={t("sortOptions.name")}
            sortKey="name"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/contact"
            searchParams={{ q: query, status: statusFilter, from: fromDate, to: toDate }}
          />
          <AdminSortHeader
            label={t("sortOptions.status")}
            sortKey="status"
            currentSort={sort}
            currentOrder={order}
            baseUrl="/admin/contact"
            searchParams={{ q: query, status: statusFilter, from: fromDate, to: toDate }}
          />
        </div>
      </div>

      {/* Submissions list */}
      <div className="grid gap-3">
        {submissions.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("noSubmissionsFound")}
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Link key={submission.id} href={`/admin/contact/${submission.id}`}>
              <Card className="border-0 bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 rounded-full p-1.5 text-white ${statusColors[submission.status]}`}
                    >
                      {statusIcons[submission.status]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{submission.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {t(`subjects.${submission.subject}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{submission.email}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {submission.message}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {submission.createdAt.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submission.createdAt.toLocaleTimeString()}
                      </p>
                      {submission.recaptchaScore !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("score")}: {submission.recaptchaScore.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        baseUrl="/admin/contact"
        searchParams={{
          q: query,
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
