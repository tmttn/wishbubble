import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isPushConfigured } from "@/lib/push";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// POST /api/push/subscribe - Store push subscription for current user
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: "Push notifications not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = subscribeSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    const { endpoint, keys } = validatedData.data;
    const userAgent = request.headers.get("user-agent") || undefined;

    // Upsert subscription (update if exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint,
        },
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    // Enable push notifications for the user if not already enabled
    await prisma.user.update({
      where: { id: session.user.id },
      data: { notifyPush: true },
    });

    logger.info("Push subscription created/updated", {
      userId: session.user.id,
      subscriptionId: subscription.id,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    logger.error("Error creating push subscription", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/push/subscribe - Remove subscription for current device
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    // Delete the subscription for this endpoint
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    });

    // Check if user has any remaining subscriptions
    const remainingSubscriptions = await prisma.pushSubscription.count({
      where: { userId: session.user.id },
    });

    // If no subscriptions remain, disable push notifications
    if (remainingSubscriptions === 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { notifyPush: false },
      });
    }

    logger.info("Push subscription removed", {
      userId: session.user.id,
      endpoint,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error removing push subscription", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
