import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const simulateSchema = z.object({
  eventType: z.enum([
    "payment_succeeded",
    "payment_failed",
    "item_claimed",
    "email_send",
    "notification_trigger",
    "trial_expiring",
  ]),
  userId: z.string().optional(),
});

/**
 * POST /api/admin/simulate
 * Simulates various system events for testing purposes
 */
export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const adminUser = adminCheck.session!.user;
    const body = await request.json();
    const validation = simulateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { eventType, userId } = validation.data;

    // For user-specific events, verify the user exists
    let targetUser = null;
    if (userId) {
      targetUser = await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: { id: true, name: true, email: true },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }

    // Log the simulation event
    await prisma.activity.create({
      data: {
        type: "SIMULATION_TRIGGERED",
        userId: targetUser?.id || adminUser.id,
        metadata: {
          eventType,
          targetUserId: targetUser?.id,
          targetUserEmail: targetUser?.email,
          simulatedBy: adminUser.id,
          simulatedByEmail: adminUser.email,
        },
      },
    });

    // Handle each event type
    let result: { success: boolean; message: string; data?: unknown } = {
      success: true,
      message: `Event ${eventType} simulated successfully`,
    };

    switch (eventType) {
      case "payment_succeeded":
        if (!targetUser) {
          return NextResponse.json(
            { error: "User ID required for payment events" },
            { status: 400 }
          );
        }
        // Simulate payment success by creating an activity
        await prisma.activity.create({
          data: {
            type: "PAYMENT_SUCCEEDED",
            userId: targetUser.id,
            metadata: {
              amount: 999, // €9.99 in cents
              currency: "EUR",
              simulated: true,
              simulatedBy: adminUser.id,
            },
          },
        });
        result.message = `Payment succeeded event simulated for ${targetUser.name || targetUser.email}`;
        break;

      case "payment_failed":
        if (!targetUser) {
          return NextResponse.json(
            { error: "User ID required for payment events" },
            { status: 400 }
          );
        }
        await prisma.activity.create({
          data: {
            type: "PAYMENT_FAILED",
            userId: targetUser.id,
            metadata: {
              amount: 999,
              currency: "EUR",
              reason: "card_declined",
              simulated: true,
              simulatedBy: adminUser.id,
            },
          },
        });
        result.message = `Payment failed event simulated for ${targetUser.name || targetUser.email}`;
        break;

      case "item_claimed":
        if (!targetUser) {
          return NextResponse.json(
            { error: "User ID required for item claim events" },
            { status: 400 }
          );
        }
        // Find a random item from one of the user's wishlists to simulate claiming
        const userWishlist = await prisma.wishlist.findFirst({
          where: {
            user: {
              bubbleMemberships: {
                some: {
                  bubble: {
                    members: {
                      some: { userId: targetUser.id },
                    },
                  },
                },
              },
            },
          },
          include: {
            items: { take: 1 },
          },
        });

        await prisma.activity.create({
          data: {
            type: "ITEM_CLAIMED",
            userId: targetUser.id,
            metadata: {
              itemId: userWishlist?.items[0]?.id || "simulated-item",
              itemTitle: userWishlist?.items[0]?.title || "Simulated Item",
              simulated: true,
              simulatedBy: adminUser.id,
            },
          },
        });
        result.message = `Item claim event simulated for ${targetUser.name || targetUser.email}`;
        break;

      case "email_send":
        // Check email queue status
        const pendingEmails = await prisma.emailQueue.count({
          where: { status: "PENDING" },
        });
        result.message = `Email queue check complete. ${pendingEmails} emails pending.`;
        result.data = { pendingEmails };
        break;

      case "notification_trigger":
        // Check notifications
        const unreadNotifications = await prisma.notification.count({
          where: { readAt: null },
        });
        result.message = `Notification check complete. ${unreadNotifications} unread notifications.`;
        result.data = { unreadNotifications };
        break;

      case "trial_expiring":
        if (!targetUser) {
          return NextResponse.json(
            { error: "User ID required for trial events" },
            { status: 400 }
          );
        }
        await prisma.activity.create({
          data: {
            type: "TRIAL_ENDED",
            userId: targetUser.id,
            metadata: {
              daysRemaining: 3,
              simulated: true,
              simulatedBy: adminUser.id,
            },
          },
        });
        result.message = `Trial expiring event simulated for ${targetUser.name || targetUser.email}`;
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error simulating event:", error);
    return NextResponse.json(
      { error: "Failed to simulate event" },
      { status: 500 }
    );
  }
}
