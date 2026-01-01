import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBulkNotifications } from "@/lib/notifications";
import { sendEventApproachingEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It sends reminders for events happening in 1 day or 7 days

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "event-reminder" });
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
    let emailsSent = 0;

    for (const bubble of bubbles) {
      if (!bubble.eventDate) continue;

      // Calculate days until event
      const eventDate = new Date(bubble.eventDate);
      const daysUntil = Math.ceil(
        (eventDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)
      );

      const bubbleUrl = `${baseUrl}/bubbles/${bubble.slug}`;
      const urgencyText = daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;

      // Create in-app notifications
      const usersForInApp = bubble.members
        .filter((m) => m.user.notifyInApp)
        .map((m) => m.userId);

      if (usersForInApp.length > 0) {
        await createBulkNotifications(usersForInApp, {
          type: "EVENT_APPROACHING",
          title: `${bubble.name} is ${urgencyText}!`,
          body: `Don't forget to check wishlists and get your gifts ready.`,
          bubbleId: bubble.id,
        });
        notificationsCreated += usersForInApp.length;
      }

      // Send email notifications
      for (const member of bubble.members) {
        const user = member.user;

        if (user.notifyEmail && user.emailOnEventReminder) {
          try {
            await sendEventApproachingEmail({
              to: user.email,
              userName: user.name || "there",
              bubbleName: bubble.name,
              bubbleUrl,
              eventDate,
              daysUntil,
              locale: user.locale,
            });
            emailsSent++;
          } catch (emailError) {
            logger.error("Failed to send event reminder email", emailError, {
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
      emailsSent,
    });

    return NextResponse.json({
      success: true,
      bubblesChecked: bubbles.length,
      notificationsCreated,
      emailsSent,
    });
  } catch (error) {
    logger.error("Error processing event reminders", error);

    return NextResponse.json(
      { error: "Failed to process event reminders" },
      { status: 500 }
    );
  }
}
