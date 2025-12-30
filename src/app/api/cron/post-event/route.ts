import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBulkNotifications } from "@/lib/notifications";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It checks for bubbles whose events just passed and sends notifications

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Find bubbles whose event date was yesterday and haven't been processed
    const bubbles = await prisma.bubble.findMany({
      where: {
        eventDate: {
          gte: yesterday,
          lt: today,
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

      const claimedCount = claims.filter((c) => c.status === "CLAIMED").length;
      const purchasedCount = claims.filter((c) => c.status === "PURCHASED").length;

      // Create notifications for all members
      const memberUserIds = bubble.members.map((m) => m.userId);

      if (memberUserIds.length > 0) {
        await createBulkNotifications(memberUserIds, {
          type: "EVENT_COMPLETED",
          title: `${bubble.name} has ended!`,
          body: `The event is complete. ${purchasedCount} gifts were purchased. Check out the gift summary!`,
          bubbleId: bubble.id,
        });
        notificationsCreated += memberUserIds.length;
      }

      // Mark bubble as processed
      await prisma.bubble.update({
        where: { id: bubble.id },
        data: { postEventProcessed: true },
      });

      bubblesProcessed++;
    }

    return NextResponse.json({
      success: true,
      bubblesProcessed,
      notificationsCreated,
    });
  } catch (error) {
    console.error("Error processing post-event notifications:", error);
    return NextResponse.json(
      { error: "Failed to process post-event notifications" },
      { status: 500 }
    );
  }
}
