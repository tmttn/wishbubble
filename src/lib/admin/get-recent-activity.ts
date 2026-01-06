import { prisma } from "@/lib/db";
import { ActivityType } from "@prisma/client";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  bubbleId: string | null;
  bubbleName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export async function getRecentActivity(
  limit: number = 10
): Promise<ActivityItem[]> {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { name: true, email: true },
      },
      bubble: {
        select: { name: true },
      },
    },
  });

  return activities.map((a) => ({
    id: a.id,
    type: a.type,
    userId: a.userId,
    userName: a.user?.name ?? null,
    userEmail: a.user?.email ?? null,
    bubbleId: a.bubbleId,
    bubbleName: a.bubble?.name ?? null,
    metadata: a.metadata as Record<string, unknown> | null,
    createdAt: a.createdAt,
  }));
}
