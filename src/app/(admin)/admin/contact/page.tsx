import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, AlertCircle, CheckCircle, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactStatus, ContactSubject } from "@prisma/client";
import { getTranslations } from "next-intl/server";

interface ContactPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
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
  const perPage = 20;

  const where = statusFilter ? { status: statusFilter } : {};

  const [submissions, total, statusCounts] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("totalSubmissions", { count: total })}</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/contact">
          <Badge
            variant={!statusFilter ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            {t("all")} ({counts.NEW + counts.IN_PROGRESS + counts.RESOLVED + counts.SPAM})
          </Badge>
        </Link>
        <Link href="/admin/contact?status=NEW">
          <Badge
            variant={statusFilter === "NEW" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            {t("new")} ({counts.NEW})
          </Badge>
        </Link>
        <Link href="/admin/contact?status=IN_PROGRESS">
          <Badge
            variant={statusFilter === "IN_PROGRESS" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            {t("inProgress")} ({counts.IN_PROGRESS})
          </Badge>
        </Link>
        <Link href="/admin/contact?status=RESOLVED">
          <Badge
            variant={statusFilter === "RESOLVED" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            {t("resolved")} ({counts.RESOLVED})
          </Badge>
        </Link>
        <Link href="/admin/contact?status=SPAM">
          <Badge
            variant={statusFilter === "SPAM" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            {t("spam")} ({counts.SPAM})
          </Badge>
        </Link>
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
                  href={`/admin/contact?${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}
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
                  href={`/admin/contact?${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}
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
