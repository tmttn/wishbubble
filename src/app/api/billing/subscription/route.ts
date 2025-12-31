import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelSubscription, reactivateSubscription } from "@/lib/stripe";
import { getUserUsageStats } from "@/lib/plans";

// GET /api/billing/subscription - Get current subscription and usage
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subscription, usageStats] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          tier: true,
          interval: true,
          status: true,
          trialEndsAt: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          canceledAt: true,
        },
      }),
      getUserUsageStats(session.user.id),
    ]);

    return NextResponse.json({
      subscription,
      usage: usageStats,
    });
  } catch (error) {
    console.error("[Billing] Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/billing/subscription - Cancel subscription
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await cancelSubscription(session.user.id);

    return NextResponse.json({ success: true, message: "Subscription will be canceled at period end" });
  } catch (error) {
    console.error("[Billing] Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

// PATCH /api/billing/subscription - Reactivate canceled subscription
export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await reactivateSubscription(session.user.id);

    return NextResponse.json({ success: true, message: "Subscription reactivated" });
  } catch (error) {
    console.error("[Billing] Reactivate subscription error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
