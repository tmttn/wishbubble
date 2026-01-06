import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getQueueStats, retryEmail } from "@/lib/email/queue";
import { EmailQueueStatus, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireAdminApi();
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "50");
    const status = searchParams.get("status") as EmailQueueStatus | null;
    const type = searchParams.get("type");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Build where clause
    const where: Prisma.EmailQueueWhereInput = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate + "T23:59:59.999Z") } : {}),
            },
          }
        : {}),
    };

    // Fetch emails and stats in parallel
    const [emails, total, stats, typeGroups] = await Promise.all([
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

    return NextResponse.json({
      emails: emails.map((email) => ({
        ...email,
        createdAt: email.createdAt.toISOString(),
        updatedAt: email.updatedAt.toISOString(),
        scheduledFor: email.scheduledFor.toISOString(),
        processedAt: email.processedAt?.toISOString() || null,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      stats,
      typeGroups: typeGroups.map((t) => ({ type: t.type, count: t._count })),
    });
  } catch (error) {
    logger.error("Admin email queue error", error);
    return NextResponse.json(
      { error: "Failed to fetch email queue" },
      { status: 500 }
    );
  }
}

// POST - Retry a failed email
export async function POST(request: Request) {
  const authResult = await requireAdminApi();
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body = await request.json();
    const { action, emailId } = body;

    if (action === "retry" && emailId) {
      const result = await retryEmail(emailId);
      if (result.success) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    if (action === "retryAll") {
      // Retry all failed emails
      const result = await prisma.emailQueue.updateMany({
        where: { status: EmailQueueStatus.FAILED },
        data: {
          status: EmailQueueStatus.PENDING,
          attempts: 0,
          scheduledFor: new Date(),
          lastError: null,
        },
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Admin email queue action error", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
