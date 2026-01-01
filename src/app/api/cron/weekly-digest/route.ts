import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLocalizedNotification } from "@/lib/notifications";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It sends weekly digest emails to users based on their preferred day

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "weekly-digest",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 11 * * *" },
      maxRuntime: 5,
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "weekly-digest" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "weekly-digest",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

    // Find users who have digest enabled and whose preferred day matches today
    const users = await prisma.user.findMany({
      where: {
        notifyEmail: true,
        notifyDigest: true,
        digestDay: currentDay,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        locale: true,
        notifyInApp: true,
        bubbleMemberships: {
          where: { leftAt: null },
          select: {
            bubbleId: true,
            joinedAt: true,
            bubble: {
              select: {
                id: true,
                name: true,
                slug: true,
                eventDate: true,
                archivedAt: true,
                members: {
                  where: { leftAt: null },
                  select: {
                    joinedAt: true,
                  },
                },
                wishlists: {
                  select: {
                    wishlist: {
                      select: {
                        items: {
                          where: {
                            createdAt: { gte: oneWeekAgo },
                            deletedAt: null,
                          },
                          select: { id: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const user of users) {
      // Only include active bubbles (not archived)
      const activeMemberships = user.bubbleMemberships.filter(
        (m) => m.bubble.archivedAt === null
      );

      if (activeMemberships.length === 0) continue;

      // Build bubble activity data
      const bubbles = activeMemberships.map((m) => {
        const bubble = m.bubble;

        // Count new members joined in the last week
        const newMembers = bubble.members.filter(
          (member) => member.joinedAt >= oneWeekAgo
        ).length;

        // Count new wishlist items added in the last week
        const newItems = bubble.wishlists.reduce(
          (sum, bw) => sum + bw.wishlist.items.length,
          0
        );

        // Check for upcoming event
        const upcomingEvent =
          bubble.eventDate && new Date(bubble.eventDate) > now
            ? new Date(bubble.eventDate)
            : undefined;

        return {
          name: bubble.name,
          url: `${baseUrl}/bubbles/${bubble.slug}`,
          newMembers,
          newItems,
          upcomingEvent,
        };
      });

      // Filter to only include bubbles with activity or upcoming events
      const bubblesWithActivity = bubbles.filter(
        (b) => b.newMembers > 0 || b.newItems > 0 || b.upcomingEvent
      );

      // Skip if no activity to report
      if (bubblesWithActivity.length === 0) continue;

      // Send email
      try {
        await sendWeeklyDigestEmail({
          to: user.email,
          userName: user.name || "there",
          bubbles: bubblesWithActivity,
          locale: user.locale,
        });
        emailsSent++;
      } catch (emailError) {
        logger.error("Failed to send weekly digest email", emailError, {
          email: user.email,
          userId: user.id,
        });
      }

      // Create in-app notification if enabled
      if (user.notifyInApp) {
        const totalActivity = bubblesWithActivity.reduce(
          (sum, b) => sum + b.newMembers + b.newItems,
          0
        );

        await createLocalizedNotification(user.id, {
          type: "WEEKLY_DIGEST",
          messageType: "weeklyDigest",
          messageParams: {
            updateCount: totalActivity,
            bubbleCount: bubblesWithActivity.length,
          },
        });
        notificationsCreated++;
      }
    }

    logger.info("Weekly digest cron completed", {
      usersProcessed: users.length,
      emailsSent,
      notificationsCreated,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "weekly-digest",
      status: "ok",
    });

    return NextResponse.json({
      success: true,
      usersProcessed: users.length,
      emailsSent,
      notificationsCreated,
    });
  } catch (error) {
    logger.error("Error processing weekly digests", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "weekly-digest",
      status: "error",
    });

    return NextResponse.json(
      { error: "Failed to process weekly digests" },
      { status: 500 }
    );
  }
}
