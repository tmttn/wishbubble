import webPush from "web-push";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// VAPID configuration - deferred until runtime to avoid build errors
let vapidConfigured = false;

function getVapidConfig() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:noreply@notifications.wish-bubble.app";
  return { vapidPublicKey, vapidPrivateKey, vapidSubject };
}

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const { vapidPublicKey, vapidPrivateKey, vapidSubject } = getVapidConfig();

  if (!vapidPublicKey || !vapidPrivateKey) {
    return false;
  }

  try {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    vapidConfigured = true;
    return true;
  } catch (error) {
    logger.error("Failed to configure VAPID keys", error);
    return false;
  }
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

/**
 * Send push notification to a single user
 * Sends to all registered devices for that user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) {
    logger.warn("VAPID keys not configured, skipping push notification");
    return { sent: 0, failed: 0 };
  }

  // Check if user has push notifications enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyPush: true },
  });

  if (!user?.notifyPush) {
    return { sent: 0, failed: 0 };
  }

  // Get all push subscriptions for this user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-72x72.png",
    tag: payload.tag,
  });

  let sent = 0;
  let failed = 0;
  const invalidSubscriptions: string[] = [];

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        pushPayload
      );
      sent++;
    } catch (error: unknown) {
      failed++;
      const statusCode = (error as { statusCode?: number })?.statusCode;

      // Handle expired/invalid subscriptions (410 Gone, 404 Not Found)
      if (statusCode === 410 || statusCode === 404) {
        invalidSubscriptions.push(subscription.id);
        logger.info("Push subscription expired, marking for cleanup", {
          subscriptionId: subscription.id,
          userId,
          statusCode,
        });
      } else {
        logger.error("Failed to send push notification", error, {
          subscriptionId: subscription.id,
          userId,
          statusCode,
        });
      }
    }
  }

  // Clean up invalid subscriptions
  if (invalidSubscriptions.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: invalidSubscriptions } },
    });
    logger.info("Cleaned up invalid push subscriptions", {
      count: invalidSubscriptions.length,
      userId,
    });
  }

  return { sent, failed };
}

/**
 * Send push notification to multiple users
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

/**
 * Check if VAPID keys are configured
 */
export function isPushConfigured(): boolean {
  const { vapidPublicKey, vapidPrivateKey } = getVapidConfig();
  return !!(vapidPublicKey && vapidPrivateKey);
}

/**
 * Get the public VAPID key for client subscription
 */
export function getPublicVapidKey(): string | null {
  const { vapidPublicKey } = getVapidConfig();
  return vapidPublicKey || null;
}
