import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ContactSubject } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, message, browserInfo, lastError, sentryEventId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Map feedback type to contact subject
    const subjectMap: Record<string, ContactSubject> = {
      bug: "BUG_REPORT",
      feature: "FEATURE_REQUEST",
      other: "OTHER",
    };

    // Build message with context
    const contextInfo = [
      `[Feedback Widget]`,
      `User: ${session.user.email}`,
      `Page: ${browserInfo?.pathname || "unknown"}`,
      browserInfo?.screenSize ? `Screen: ${browserInfo.screenSize}` : null,
      sentryEventId ? `Sentry Event: ${sentryEventId}` : null,
      lastError ? `Recent Error: ${lastError}` : null,
      "",
      "Message:",
      message.trim(),
    ].filter(Boolean).join("\n");

    // Create contact submission with all the context
    const submission = await prisma.contactSubmission.create({
      data: {
        name: session.user.name || session.user.email || "Anonymous",
        email: session.user.email || "no-email@wishbubble.app",
        subject: subjectMap[type] || "OTHER",
        message: contextInfo,
        locale: browserInfo?.language?.split("-")[0] || "en",
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown",
        userAgent: browserInfo?.userAgent,
      },
    });

    logger.info("Feedback submitted via widget", {
      submissionId: submission.id,
      userId: session.user.id,
      type,
      hasSentryEventId: !!sentryEventId,
    });

    // Also notify admins (reuse existing notification logic)
    const admins = await prisma.user.findMany({
      where: { isAdmin: true, deletedAt: null },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SYSTEM" as const,
          title: "New Feedback Received",
          body: `${session.user?.name || session.user?.email} reported a ${type}: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`,
          data: { submissionId: submission.id, url: `/admin/contact/${submission.id}` },
        })),
      });
    }

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error) {
    logger.error("Failed to submit feedback", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
