import { prisma } from "@/lib/db";
import { NotificationType, Prisma } from "@prisma/client";
import {
  getNotificationContent,
  getSomeone,
  getTheOwner,
  getEventUrgency,
  type NotificationMessageType,
} from "@/lib/i18n-server";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  bubbleId?: string;
  itemId?: string;
  data?: Prisma.InputJsonValue;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  bubbleId,
  itemId,
  data,
}: CreateNotificationParams) {
  // Check if user has in-app notifications enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyInApp: true },
  });

  if (!user?.notifyInApp) {
    return null;
  }

  return prisma.notification.create({
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
}

/**
 * Create a single localized notification for a user
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

  const { title, body } = await getNotificationContent(
    user.locale,
    params.messageType,
    params.messageParams
  );

  return prisma.notification.create({
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
}

/**
 * Create localized notifications for multiple users
 * Each user receives the notification in their preferred language
 */
export async function createLocalizedBulkNotifications(
  userIds: string[],
  params: Omit<LocalizedNotificationParams, "userId">
) {
  if (userIds.length === 0) {
    return [];
  }

  // Get users who have in-app notifications enabled with their locale
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      notifyInApp: true,
    },
    select: { id: true, locale: true },
  });

  if (users.length === 0) {
    return [];
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

  return allNotifications;
}

// Re-export helper functions for use in API routes
export { getSomeone, getTheOwner, getEventUrgency };
