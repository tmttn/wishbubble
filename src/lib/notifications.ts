import { prisma } from "@/lib/db";
import { NotificationType, Prisma } from "@prisma/client";
import {
  getNotificationContent,
  getSomeone,
  getTheOwner,
  getEventUrgency,
  type NotificationMessageType,
} from "@/lib/i18n-server";
import { sendPushNotification, sendBulkPushNotifications } from "@/lib/push";
import { logger } from "@/lib/logger";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  bubbleId?: string;
  itemId?: string;
  data?: Prisma.InputJsonValue;
  /** URL to navigate to when push notification is clicked */
  url?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  bubbleId,
  itemId,
  data,
  url,
}: CreateNotificationParams) {
  // Check if user has in-app notifications enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyInApp: true },
  });

  if (!user?.notifyInApp) {
    return null;
  }

  // Create in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      bubbleId,
      itemId,
      data,
    },
  });

  // Send push notification (async, don't block)
  const pushUrl = url || (bubbleId ? `/bubbles/${bubbleId}` : "/notifications");
  sendPushNotification(userId, {
    title,
    body,
    url: pushUrl,
    tag: `${type}-${bubbleId || itemId || notification.id}`,
  }).catch((err) => {
    logger.error("Failed to send push notification", err, { userId, type });
  });

  return notification;
}

export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  // Get users who have in-app notifications enabled
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      notifyInApp: true,
    },
    select: { id: true },
  });

  const notifications = users.map((user) => ({
    userId: user.id,
    type: params.type,
    title: params.title,
    body: params.body,
    bubbleId: params.bubbleId,
    itemId: params.itemId,
    data: params.data,
  }));

  if (notifications.length === 0) {
    return [];
  }

  await prisma.notification.createMany({
    data: notifications,
  });

  // Send push notifications (async, don't block)
  const pushUrl = params.url || (params.bubbleId ? `/bubbles/${params.bubbleId}` : "/notifications");
  sendBulkPushNotifications(
    users.map((u) => u.id),
    {
      title: params.title,
      body: params.body,
      url: pushUrl,
      tag: `${params.type}-${params.bubbleId || params.itemId || "bulk"}`,
    }
  ).catch((err) => {
    logger.error("Failed to send bulk push notifications", err, {
      type: params.type,
      userCount: users.length,
    });
  });

  return notifications;
}

/**
 * Localized notification parameters
 */
interface LocalizedNotificationParams {
  type: NotificationType;
  messageType: NotificationMessageType;
  messageParams: Record<string, string | number>;
  bubbleId?: string;
  itemId?: string;
  data?: Prisma.InputJsonValue;
  /** URL to navigate to when push notification is clicked */
  url?: string;
}

/**
 * Create a single localized notification for a user
 * Respects per-bubble notification preferences (notifyActivity on BubbleMember)
 */
export async function createLocalizedNotification(
  userId: string,
  params: LocalizedNotificationParams
) {
  // Get user with their locale and notification preference
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyInApp: true, locale: true },
  });

  if (!user?.notifyInApp) {
    return null;
  }

  // If this notification is for a specific bubble, check if user has muted it
  if (params.bubbleId) {
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: params.bubbleId,
        userId,
        leftAt: null,
      },
      select: { notifyActivity: true },
    });

    if (membership && !membership.notifyActivity) {
      return null;
    }
  }

  const { title, body } = await getNotificationContent(
    user.locale,
    params.messageType,
    params.messageParams
  );

  const notification = await prisma.notification.create({
    data: {
      userId,
      type: params.type,
      title,
      body,
      bubbleId: params.bubbleId,
      itemId: params.itemId,
      data: params.data,
    },
  });

  // Send push notification (async, don't block)
  const pushUrl = params.url || (params.bubbleId ? `/bubbles/${params.bubbleId}` : "/notifications");
  sendPushNotification(userId, {
    title,
    body,
    url: pushUrl,
    tag: `${params.type}-${params.bubbleId || params.itemId || notification.id}`,
  }).catch((err) => {
    logger.error("Failed to send push notification", err, { userId, type: params.type });
  });

  return notification;
}

/**
 * Create localized notifications for multiple users
 * Each user receives the notification in their preferred language
 * Respects per-bubble notification preferences (notifyActivity on BubbleMember)
 */
export async function createLocalizedBulkNotifications(
  userIds: string[],
  params: Omit<LocalizedNotificationParams, "userId">
) {
  if (userIds.length === 0) {
    return [];
  }

  // Get users who have in-app notifications enabled with their locale
  let users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      notifyInApp: true,
    },
    select: { id: true, locale: true },
  });

  if (users.length === 0) {
    return [];
  }

  // If this notification is for a specific bubble, filter out users who have muted it
  if (params.bubbleId) {
    const mutedMembers = await prisma.bubbleMember.findMany({
      where: {
        bubbleId: params.bubbleId,
        userId: { in: users.map((u) => u.id) },
        notifyActivity: false,
        leftAt: null,
      },
      select: { userId: true },
    });

    const mutedUserIds = new Set(mutedMembers.map((m) => m.userId));
    users = users.filter((u) => !mutedUserIds.has(u.id));

    if (users.length === 0) {
      return [];
    }
  }

  // Group users by locale to minimize translation lookups
  const usersByLocale = new Map<string, string[]>();
  for (const user of users) {
    const locale = user.locale || "en";
    const existing = usersByLocale.get(locale) || [];
    existing.push(user.id);
    usersByLocale.set(locale, existing);
  }

  // Create notifications for each locale group
  const allNotifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    bubbleId?: string;
    itemId?: string;
    data?: Prisma.InputJsonValue;
  }> = [];

  for (const [locale, localeUserIds] of usersByLocale) {
    const { title, body } = await getNotificationContent(
      locale,
      params.messageType,
      params.messageParams
    );

    for (const userId of localeUserIds) {
      allNotifications.push({
        userId,
        type: params.type,
        title,
        body,
        bubbleId: params.bubbleId,
        itemId: params.itemId,
        data: params.data,
      });
    }
  }

  await prisma.notification.createMany({
    data: allNotifications,
  });

  // Send push notifications for each locale group (async, don't block)
  const pushUrl = params.url || (params.bubbleId ? `/bubbles/${params.bubbleId}` : "/notifications");
  for (const [locale, localeUserIds] of usersByLocale) {
    const { title, body } = await getNotificationContent(
      locale,
      params.messageType,
      params.messageParams
    );

    sendBulkPushNotifications(localeUserIds, {
      title,
      body,
      url: pushUrl,
      tag: `${params.type}-${params.bubbleId || params.itemId || "bulk"}`,
    }).catch((err) => {
      logger.error("Failed to send bulk push notifications", err, {
        type: params.type,
        locale,
        userCount: localeUserIds.length,
      });
    });
  }

  return allNotifications;
}

// Re-export helper functions for use in API routes
export { getSomeone, getTheOwner, getEventUrgency };
