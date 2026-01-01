import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { SubscriptionTier, BillingInterval } from "@prisma/client";
import { z } from "zod";
import { logger } from "@/lib/logger";

const checkoutSchema = z.object({
  tier: z.enum(["PREMIUM", "FAMILY"]),
  interval: z.enum(["MONTHLY", "YEARLY"]),
  couponCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { tier, interval, couponCode } = validation.data;

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ["ACTIVE", "TRIALING", "PAST_DUE"],
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: "Already subscribed",
          details: "You already have an active subscription. Please manage it from your billing settings."
        },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      tier: tier as SubscriptionTier,
      interval: interval as BillingInterval,
      couponCode,
      successUrl: `${baseUrl}/settings/billing?success=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("[Billing] Checkout error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create checkout session", details: message },
      { status: 500 }
    );
  }
}
