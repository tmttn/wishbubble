import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLocalizedBulkNotifications, getEventUrgency } from "@/lib/notifications";
import { queueEmail } from "@/lib/email/queue";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It sends reminders for events happening in 1 day or 7 days

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "event-reminder",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 10 * * *" },
      maxRuntime: 5,
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "event-reminder" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "event-reminder",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

    // Calculate target dates (1 day and 7 days from now)
    const oneDayFromNow = new Date(startOfToday.getTime() + 1 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find bubbles with events exactly 1 day or 7 days away
    const bubbles = await prisma.bubble.findMany({
      where: {
        archivedAt: null,
        eventDate: {
          not: null,
        },
        OR: [
          {
            eventDate: {
              gte: oneDayFromNow,
              lt: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          {
            eventDate: {
              gte: sevenDaysFromNow,
              lt: new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        ],
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
                emailOnEventReminder: true,
              },
            },
          },
        },
      },
    });

    let notificationsCreated = 0;
    let emailsQueued = 0;

    for (const bubble of bubbles) {
      if (!bubble.eventDate) continue;

      // Calculate days until event
      const eventDate = new Date(bubble.eventDate);
      const daysUntil = Math.ceil(
        (eventDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)
      );

      const bubbleUrl = `${baseUrl}/bubbles/${bubble.slug}`;

      // Create in-app notifications - group by locale for proper urgency text
      const membersForInApp = bubble.members.filter((m) => m.user.notifyInApp);

      // Group members by locale
      const membersByLocale = new Map<string, string[]>();
      for (const member of membersForInApp) {
        const locale = member.user.locale || "en";
        const existing = membersByLocale.get(locale) || [];
        existing.push(member.userId);
        membersByLocale.set(locale, existing);
      }

      // Create notifications per locale group with correct urgency text
      for (const [locale, userIds] of membersByLocale) {
        const urgencyText = await getEventUrgency(locale, daysUntil);
        await createLocalizedBulkNotifications(userIds, {
          type: "EVENT_APPROACHING",
          messageType: "eventApproaching",
          messageParams: {
            bubbleName: bubble.name,
            urgency: urgencyText,
          },
          bubbleId: bubble.id,
        });
        notificationsCreated += userIds.length;
      }

      // Queue email notifications
      for (const member of bubble.members) {
        const user = member.user;

        if (user.notifyEmail && user.emailOnEventReminder) {
          const result = await queueEmail("eventApproaching", user.email, {
            userName: user.name || "there",
            bubbleName: bubble.name,
            bubbleUrl,
            eventDate: eventDate.toISOString(),
            daysUntil,
            locale: user.locale,
          });

          if (result.success) {
            emailsQueued++;
          } else {
            logger.error("Failed to queue event reminder email", result.error, {
              email: user.email,
              bubbleId: bubble.id,
            });
          }
        }
      }
    }

    logger.info("Event reminder cron completed", {
      bubblesChecked: bubbles.length,
      notificationsCreated,
      emailsQueued,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "event-reminder",
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
    logger.error("Error processing event reminders", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "event-reminder",
      status: "error",
    });

    // Flush Sentry events before serverless function terminates
    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Failed to process event reminders" },
      { status: 500 }
    );
  }
}
