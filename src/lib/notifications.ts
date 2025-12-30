import { prisma } from "@/lib/db";
import { NotificationType, Prisma } from "@prisma/client";

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
