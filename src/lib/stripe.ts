/**
 * Stripe integration for WishBubble subscriptions.
 */

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { PLANS, STRIPE_PRICES } from "@/lib/plans";
import { SubscriptionTier, BillingInterval } from "@prisma/client";

// Lazy initialization of Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    console.log("[Stripe] Initializing client...");
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
      maxNetworkRetries: 3,
      timeout: 30000, // 30 seconds
    });
  }
  return stripeInstance;
}

// For convenience, export a getter (use getStripe() for guaranteed fresh instance)
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get subscriptions() { return getStripe().subscriptions; },
  get coupons() { return getStripe().coupons; },
  get webhooks() { return getStripe().webhooks; },
};

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Return existing customer ID if available
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId: user.id,
    },
  });

  // Save customer ID to user
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ============================================
// CHECKOUT SESSION
// ============================================

export interface CreateCheckoutOptions {
  userId: string;
  tier: SubscriptionTier;
  interval: BillingInterval;
  couponCode?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  options: CreateCheckoutOptions
): Promise<Stripe.Checkout.Session> {
  const { userId, tier, interval, couponCode, successUrl, cancelUrl } = options;

  // Get or create customer
  const customerId = await getOrCreateStripeCustomer(userId);

  // Get price ID
  const priceId =
    tier === "PREMIUM"
      ? interval === "YEARLY"
        ? STRIPE_PRICES.PREMIUM.yearly
        : STRIPE_PRICES.PREMIUM.monthly
      : interval === "YEARLY"
        ? STRIPE_PRICES.FAMILY.yearly
        : STRIPE_PRICES.FAMILY.monthly;

  if (!priceId) {
    throw new Error(`Price not configured for ${tier} ${interval}`);
  }

  // Get trial days (only if > 0)
  const trialDays = PLANS[tier]?.limits?.trialDays;

  // Build checkout session params
  const params: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      ...(trialDays && trialDays > 0 ? { trial_period_days: trialDays } : {}),
      metadata: {
        userId,
        tier,
        interval,
      },
    },
    metadata: {
      userId,
      tier,
      interval,
    },
    allow_promotion_codes: true, // Allow Stripe promotion codes
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
    customer_update: {
      address: "auto",
      name: "auto",
    },
  };

  console.log("[Stripe] Creating checkout session:", {
    customerId,
    priceId,
    tier,
    interval,
    trialDays,
  });

  // Apply coupon if provided
  if (couponCode) {
    // Look up coupon in our database first
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (coupon?.stripeCouponId) {
      params.discounts = [{ coupon: coupon.stripeCouponId }];
      // Don't allow other promotion codes if using our coupon
      params.allow_promotion_codes = false;
    }
  }

  return stripe.checkout.sessions.create(params);
}

// ============================================
// CUSTOMER PORTAL
// ============================================

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("No Stripe customer found for user");
  }

  return stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Cancel a subscription (at period end)
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error("No active subscription found");
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error("No subscription found");
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: false },
  });
}

// ============================================
// WEBHOOK HANDLERS
// ============================================

/**
 * Handle checkout.session.completed webhook
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as SubscriptionTier;
  const interval = session.metadata?.interval as BillingInterval;

  if (!userId || !tier) {
    console.error("[Stripe] Missing metadata in checkout session");
    return;
  }

  // Get subscription details from Stripe
  const subscriptionId = session.subscription as string;
  const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // Handle both direct subscription and response wrapper
  const stripeSubscription = 'data' in subResponse
    ? (subResponse as unknown as { data: Stripe.Subscription }).data
    : subResponse;

  // Get period dates from the first item's billing thresholds or current date
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Create or update subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      stripeProductId: stripeSubscription.items.data[0].price.product as string,
      tier,
      interval,
      status: stripeSubscription.status === "trialing" ? "TRIALING" : "ACTIVE",
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      stripeProductId: stripeSubscription.items.data[0].price.product as string,
      tier,
      interval,
      status: stripeSubscription.status === "trialing" ? "TRIALING" : "ACTIVE",
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      canceledAt: null,
      cancelAtPeriodEnd: false,
    },
  });

  // Update user's subscription tier
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionTier: tier },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: "SUBSCRIPTION_CREATED",
      userId,
      metadata: { tier, interval },
    },
  });
}

/**
 * Handle customer.subscription.updated webhook
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error("[Stripe] Subscription not found:", subscription.id);
    return;
  }

  // Map Stripe status to our status
  const statusMap: Record<string, "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "UNPAID" | "PAUSED"> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    paused: "PAUSED",
  };

  const status = statusMap[subscription.status] || "ACTIVE";

  // Get period dates from the first subscription item
  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : undefined;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : undefined;

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status,
      ...(periodStart && { currentPeriodStart: periodStart }),
      ...(periodEnd && { currentPeriodEnd: periodEnd }),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  // Update user tier based on status
  if (status === "CANCELED" || status === "UNPAID") {
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: { subscriptionTier: "FREE" },
    });
  }
}

/**
 * Handle customer.subscription.deleted webhook
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) return;

  // Mark as canceled
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });

  // Downgrade user to free
  await prisma.user.update({
    where: { id: dbSubscription.userId },
    data: { subscriptionTier: "FREE" },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: "SUBSCRIPTION_CANCELED",
      userId: dbSubscription.userId,
    },
  });
}

/**
 * Get subscription ID from invoice (handles new Stripe API structure)
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  // New Stripe API structure: subscription is inside parent.subscription_details
  const subDetails = invoice.parent?.subscription_details;
  if (subDetails?.subscription) {
    return typeof subDetails.subscription === "string"
      ? subDetails.subscription
      : subDetails.subscription.id;
  }
  return null;
}

/**
 * Handle invoice.payment_succeeded webhook
 */
export async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!dbSubscription) return;

  // Record transaction
  await prisma.transaction.create({
    data: {
      subscriptionId: dbSubscription.id,
      userId: dbSubscription.userId,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "COMPLETED",
      type: "PAYMENT",
      description: `Subscription payment - ${invoice.lines.data[0]?.description || ""}`,
      completedAt: new Date(),
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: "PAYMENT_SUCCEEDED",
      userId: dbSubscription.userId,
      metadata: {
        amount: invoice.amount_paid,
        currency: invoice.currency,
      },
    },
  });
}

/**
 * Handle invoice.payment_failed webhook
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!dbSubscription) return;

  // Record failed transaction
  await prisma.transaction.create({
    data: {
      subscriptionId: dbSubscription.id,
      userId: dbSubscription.userId,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: "FAILED",
      type: "PAYMENT",
      description: "Payment failed",
      failedAt: new Date(),
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: "PAYMENT_FAILED",
      userId: dbSubscription.userId,
      metadata: {
        amount: invoice.amount_due,
        currency: invoice.currency,
      },
    },
  });

  // TODO: Send email notification about failed payment
}

// ============================================
// COUPON SYNC
// ============================================

/**
 * Create a coupon in Stripe and sync to database
 */
export async function createStripeCoupon(couponId: string): Promise<string> {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  const stripeCoupon = await stripe.coupons.create({
    id: coupon.code,
    percent_off: coupon.discountType === "PERCENTAGE" ? coupon.discountAmount : undefined,
    amount_off: coupon.discountType === "FIXED_AMOUNT" ? coupon.discountAmount : undefined,
    currency: coupon.discountType === "FIXED_AMOUNT" ? "eur" : undefined,
    duration: coupon.duration.toLowerCase() as Stripe.CouponCreateParams.Duration,
    duration_in_months:
      coupon.duration === "REPEATING" ? coupon.durationMonths || undefined : undefined,
    max_redemptions: coupon.maxRedemptions || undefined,
    redeem_by: coupon.validUntil
      ? Math.floor(coupon.validUntil.getTime() / 1000)
      : undefined,
    metadata: {
      couponId: coupon.id,
    },
  });

  // Update coupon with Stripe ID
  await prisma.coupon.update({
    where: { id: couponId },
    data: { stripeCouponId: stripeCoupon.id },
  });

  return stripeCoupon.id;
}
