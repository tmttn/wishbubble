import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";
import { getTranslations } from "next-intl/server";
import { EmailQueueStatus, Prisma } from "@prisma/client";
import { AdminPagination, AdminDateFilter } from "@/components/admin";
import { getQueueStats } from "@/lib/email/queue";
import { RetryEmailButton, RetryAllButton } from "./client-components";

interface EmailQueuePageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    type?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }>;
}

const statusColors: Record<EmailQueueStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  PROCESSING: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
};

const statusIcons: Record<EmailQueueStatus, typeof Clock> = {
  PENDING: Clock,
  PROCESSING: RefreshCw,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
};

export default async function AdminEmailQueuePage({ searchParams }: EmailQueuePageProps) {
  const t = await getTranslations("admin.emailQueuePage");
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const statusFilter = params.status as EmailQueueStatus | undefined;
  const typeFilter = params.type;
  const perPage = parseInt(params.perPage || "50");
  const fromDate = params.from;
  const toDate = params.to;

  // Build where clause
  const where: Prisma.EmailQueueWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  };

  let emails: Awaited<ReturnType<typeof prisma.emailQueue.findMany>> = [];
  let total = 0;
  let stats = { pending: 0, processing: 0, completed: 0, failed: 0, recentCompleted: 0, recentFailed: 0 };
  let typeGroups: { type: string; _count: number }[] = [];

  try {
    [emails, total, stats, typeGroups] = await Promise.all([
      prisma.emailQueue.findMany({
        where,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.emailQueue.count({ where }),
      getQueueStats(),
      prisma.emailQueue.groupBy({
        by: ["type"],
        _count: true,
        orderBy: { _count: { type: "desc" } },
      }),
    ]);
  } catch (error) {
    logger.error("Error fetching email queue", error, { page, statusFilter });
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("totalEmails", { count: total })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.pending")}</p>
                <p className="text-3xl font-bold">{stats.pending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <RefreshCw className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.processing")}</p>
                <p className="text-3xl font-bold">{stats.processing.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.completed24h")}</p>
                <p className="text-3xl font-bold">{stats.recentCompleted.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.failed")}</p>
                <p className="text-3xl font-bold">{stats.failed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
          <AdminDateFilter
            fromDate={fromDate}
            toDate={toDate}
            baseUrl="/admin/email-queue"
            searchParams={{ status: statusFilter, type: typeFilter }}
          />
          {stats.failed > 0 && (
            <RetryAllButton label={t("retryAll")} />
          )}
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/email-queue${typeFilter ? `?type=${typeFilter}` : ""}`}>
            <Badge
              variant={!statusFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              {t("allStatuses")} ({total})
            </Badge>
          </Link>
          {(["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as EmailQueueStatus[]).map((status) => {
            const count =
              status === "PENDING"
                ? stats.pending
                : status === "PROCESSING"
                  ? stats.processing
                  : status === "COMPLETED"
                    ? stats.completed
                    : stats.failed;
            return (
              <Link
                key={status}
                href={`/admin/email-queue?status=${status}${typeFilter ? `&type=${typeFilter}` : ""}`}
              >
                <Badge
                  variant={statusFilter === status ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 text-sm"
                >
                  {status} ({count})
                </Badge>
              </Link>
            );
          })}
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {typeGroups.map((tg) => (
            <Link
              key={tg.type}
              href={`/admin/email-queue?type=${tg.type}${statusFilter ? `&status=${statusFilter}` : ""}`}
            >
              <Badge
                variant={typeFilter === tg.type ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {tg.type} ({tg._count})
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Email list */}
      <div className="space-y-2">
        {emails.length === 0 ? (
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("noEmails")}
            </CardContent>
          </Card>
        ) : (
          emails.map((email) => {
            const StatusIcon = statusIcons[email.status];
            return (
              <Card key={email.id} className="border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <StatusIcon
                        className={`h-4 w-4 flex-shrink-0 ${
                          email.status === "COMPLETED"
                            ? "text-emerald-500"
                            : email.status === "FAILED"
                              ? "text-red-500"
                              : email.status === "PROCESSING"
                                ? "text-cyan-500 animate-spin"
                                : "text-amber-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={statusColors[email.status]}>{email.status}</Badge>
                          <Badge variant="outline">{email.type}</Badge>
                          {email.priority === "HIGH" && (
                            <Badge variant="destructive" className="text-xs">
                              HIGH PRIORITY
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate mt-1">
                          <Mail className="h-3 w-3 inline mr-1" />
                          {email.to}
                        </div>
                        {email.lastError && (
                          <div className="text-xs text-red-500 mt-1 truncate">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {email.lastError}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{t("attempts", { count: email.attempts, max: email.maxAttempts })}</div>
                        <div>{email.createdAt.toLocaleString()}</div>
                      </div>
                      {email.status === "FAILED" && (
                        <RetryEmailButton emailId={email.id} label={t("retry")} />
                      )}
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
        baseUrl="/admin/email-queue"
        searchParams={{
          status: statusFilter,
          type: typeFilter,
          from: fromDate,
          to: toDate,
        }}
        perPageOptions={[25, 50, 100, 200]}
      />
    </div>
  );
}
