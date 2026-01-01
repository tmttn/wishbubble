import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLocalizedBulkNotifications } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It checks for bubbles whose events just passed and sends notifications

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "post-event",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 8 * * *" },
      maxRuntime: 5,
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "post-event" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "post-event",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find bubbles whose event date has passed and haven't been processed yet
    const bubbles = await prisma.bubble.findMany({
      where: {
        eventDate: {
          lt: now,
        },
        postEventProcessed: false,
        archivedAt: null,
      },
      include: {
        members: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    });

    let notificationsCreated = 0;
    let bubblesProcessed = 0;

    for (const bubble of bubbles) {
      // Get all claims for this bubble to update stats
      const claims = await prisma.claim.findMany({
        where: { bubbleId: bubble.id },
        include: {
          item: {
            select: {
              id: true,
              title: true,
              wishlist: {
                select: { userId: true },
              },
            },
          },
        },
      });

      const purchasedCount = claims.filter((c) => c.status === "PURCHASED").length;

      // Create notifications for all members
      const memberUserIds = bubble.members.map((m) => m.userId);

      if (memberUserIds.length > 0) {
        await createLocalizedBulkNotifications(memberUserIds, {
          type: "EVENT_COMPLETED",
          messageType: "eventCompleted",
          messageParams: {
            bubbleName: bubble.name,
            giftCount: purchasedCount,
          },
          bubbleId: bubble.id,
        });
        notificationsCreated += memberUserIds.length;
      }

      // Mark bubble as processed and archive it (mark as finished)
      await prisma.bubble.update({
        where: { id: bubble.id },
        data: {
          postEventProcessed: true,
          archivedAt: new Date(),
        },
      });

      bubblesProcessed++;
    }

    logger.info("Post-event cron completed", {
      bubblesProcessed,
      notificationsCreated,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "post-event",
      status: "ok",
    });

    return NextResponse.json({
      success: true,
      bubblesProcessed,
      notificationsCreated,
    });
  } catch (error) {
    logger.error("Error processing post-event notifications", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "post-event",
      status: "error",
    });

    return NextResponse.json(
      { error: "Failed to process post-event notifications" },
      { status: 500 }
    );
  }
}
