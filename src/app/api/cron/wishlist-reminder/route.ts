import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLocalizedNotification } from "@/lib/notifications";
import { queueEmail } from "@/lib/email/queue";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It checks for members who haven't added a wishlist to their bubbles
// and sends them a reminder notification

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "wishlist-reminder",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 9 * * *" },
      maxRuntime: 5,
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "wishlist-reminder" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "wishlist-reminder",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

    // Find bubbles with upcoming events (within next 7 days)
    // that have members without attached wishlists
    const bubbles = await prisma.bubble.findMany({
      where: {
        eventDate: {
          gte: now,
          lte: oneWeekFromNow,
        },
        archivedAt: null,
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                locale: true,
                notifyEmail: true,
                notifyInApp: true,
                emailOnWishlistReminder: true,
              },
            },
          },
        },
        wishlists: {
          select: {
            wishlist: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    let notificationsCreated = 0;
    let emailsQueued = 0;

    for (const bubble of bubbles) {
      // Get users who have wishlists attached to this bubble
      const usersWithWishlists = new Set(
        bubble.wishlists.map((bw) => bw.wishlist.userId)
      );

      // Find members who don't have a wishlist attached
      const membersWithoutWishlist = bubble.members.filter(
        (m) => !usersWithWishlists.has(m.userId)
      );

      for (const member of membersWithoutWishlist) {
        const user = member.user;
        const bubbleUrl = `${baseUrl}/bubbles/${bubble.slug}`;

        // Create in-app notification if enabled
        if (user.notifyInApp) {
          await createLocalizedNotification(user.id, {
            type: "REMINDER_ADD_WISHLIST",
            messageType: "wishlistReminder",
            messageParams: {
              bubbleName: bubble.name,
            },
            bubbleId: bubble.id,
          });
          notificationsCreated++;
        }

        // Queue email notification if enabled
        if (user.notifyEmail && user.emailOnWishlistReminder) {
          const result = await queueEmail("wishlistReminder", user.email, {
            userName: user.name || "there",
            bubbleName: bubble.name,
            bubbleUrl,
            eventDate: bubble.eventDate?.toISOString(),
            locale: user.locale,
          });

          if (result.success) {
            emailsQueued++;
          } else {
            logger.error("Failed to queue wishlist reminder email", result.error, {
              email: user.email,
              bubbleId: bubble.id,
            });
          }
        }
      }
    }

    logger.info("Wishlist reminder cron completed", {
      bubblesChecked: bubbles.length,
      notificationsCreated,
      emailsQueued,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "wishlist-reminder",
      status: "ok",
    });

    // Flush Sentry events before serverless function terminates
    await Sentry.flush(2000);

    return NextResponse.json({
      success: true,
      bubblesChecked: bubbles.length,
      notificationsCreated,
      emailsQueued,
    });
  } catch (error) {
    logger.error("Error processing wishlist reminders", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "wishlist-reminder",
      status: "error",
    });

    // Flush Sentry events before serverless function terminates
    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Failed to process wishlist reminders" },
      { status: 500 }
    );
  }
}
