import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { SubscriptionTier } from "@prisma/client";

const setTierSchema = z.object({
  tier: z.enum(["BASIC", "PLUS", "COMPLETE"]),
  reason: z.string().min(1, "Reason is required").max(500),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/users/[id]/tier
 * Set a user's subscription tier without requiring payment (admin override)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
    const adminSession = adminCheck.session!;

    const { id } = await params;
    const body = await request.json();

    const validation = setTierSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tier, reason } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscription: {
          select: { id: true, status: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousTier = user.subscriptionTier;

    // If user already has this tier, no action needed
    if (previousTier === tier) {
      return NextResponse.json(
        { error: `User already has ${tier} tier` },
        { status: 400 }
      );
    }

    // Update the user's tier using interactive transaction
    await prisma.$transaction(async (tx) => {
      // Update user tier
      await tx.user.update({
        where: { id },
        data: {
          subscriptionTier: tier as SubscriptionTier,
          // Clear subscription end date for admin-granted tiers
          subscriptionEnds: null,
        },
      });

      // Log the activity
      await tx.activity.create({
        data: {
          type: "ADMIN_TIER_CHANGE",
          userId: id,
          metadata: {
            adminId: adminSession.user.id,
            adminEmail: adminSession.user.email,
            previousTier,
            newTier: tier,
            reason,
          },
        },
      });

      // Handle subscription changes
      if (tier !== "BASIC" && !user.subscription) {
        // If upgrading and no existing subscription, create an admin-managed subscription record
        await tx.subscription.create({
          data: {
            userId: id,
            tier: tier as SubscriptionTier,
            status: "ACTIVE",
            interval: "MONTHLY", // Default for admin subscriptions
            // Admin-managed IDs (not real Stripe IDs)
            stripeSubscriptionId: `admin_${id}_${Date.now()}`,
            stripePriceId: `admin_price_${tier.toLowerCase()}`,
            stripeProductId: `admin_product_${tier.toLowerCase()}`,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        });
      } else if (tier !== "BASIC" && user.subscription) {
        // Update existing subscription to admin-managed
        await tx.subscription.update({
          where: { userId: id },
          data: {
            tier: tier as SubscriptionTier,
            status: "ACTIVE",
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      } else if (tier === "BASIC" && user.subscription) {
        // Downgrading to BASIC - mark subscription as canceled but keep record
        await tx.subscription.update({
          where: { userId: id },
          data: {
            status: "CANCELED",
            canceledAt: new Date(),
          },
        });
      }
    });

    logger.info("Admin changed user tier", {
      userId: id,
      adminId: adminSession.user.id,
      previousTier,
      newTier: tier,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `User tier changed from ${previousTier} to ${tier}`,
      previousTier,
      newTier: tier,
    });
  } catch (error) {
    logger.error("Error changing user tier", error);
    return NextResponse.json(
      { error: "Failed to change user tier" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/[id]/tier
 * Get a user's current tier and subscription status
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        subscriptionTier: true,
        subscriptionEnds: true,
        subscription: {
          select: {
            id: true,
            status: true,
            tier: true,
            interval: true,
            stripeSubscriptionId: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            canceledAt: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdminManaged = user.subscription?.stripeSubscriptionId?.startsWith("admin_") ?? false;

    return NextResponse.json({
      tier: user.subscriptionTier,
      subscriptionEnds: user.subscriptionEnds,
      subscription: user.subscription,
      isAdminManaged,
    });
  } catch (error) {
    logger.error("Error getting user tier", error);
    return NextResponse.json(
      { error: "Failed to get user tier" },
      { status: 500 }
    );
  }
}
