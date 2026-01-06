import { prisma } from "@/lib/db";

export interface QuickStats {
  users: {
    total: number;
    last7Days: number;
    previous7Days: number;
    trend: number; // percentage change
  };
  bubbles: {
    total: number;
    last7Days: number;
    previous7Days: number;
    trend: number;
  };
  items: {
    total: number;
    last7Days: number;
    previous7Days: number;
    trend: number;
  };
  claims: {
    total: number;
    last7Days: number;
    previous7Days: number;
    trend: number;
  };
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getQuickStats(): Promise<QuickStats> {
  const now = new Date();
  const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days14Ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersLast7d,
    usersPrev7d,
    totalBubbles,
    bubblesLast7d,
    bubblesPrev7d,
    totalItems,
    itemsLast7d,
    itemsPrev7d,
    totalClaims,
    claimsLast7d,
    claimsPrev7d,
  ] = await Promise.all([
    // Users
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: days7Ago } },
    }),
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: days14Ago, lt: days7Ago } },
    }),
    // Bubbles
    prisma.bubble.count({ where: { archivedAt: null } }),
    prisma.bubble.count({
      where: { archivedAt: null, createdAt: { gte: days7Ago } },
    }),
    prisma.bubble.count({
      where: { archivedAt: null, createdAt: { gte: days14Ago, lt: days7Ago } },
    }),
    // Items
    prisma.wishlistItem.count({ where: { deletedAt: null } }),
    prisma.wishlistItem.count({
      where: { deletedAt: null, createdAt: { gte: days7Ago } },
    }),
    prisma.wishlistItem.count({
      where: { deletedAt: null, createdAt: { gte: days14Ago, lt: days7Ago } },
    }),
    // Claims
    prisma.claim.count(),
    prisma.claim.count({ where: { claimedAt: { gte: days7Ago } } }),
    prisma.claim.count({
      where: { claimedAt: { gte: days14Ago, lt: days7Ago } },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      last7Days: usersLast7d,
      previous7Days: usersPrev7d,
      trend: calculateTrend(usersLast7d, usersPrev7d),
    },
    bubbles: {
      total: totalBubbles,
      last7Days: bubblesLast7d,
      previous7Days: bubblesPrev7d,
      trend: calculateTrend(bubblesLast7d, bubblesPrev7d),
    },
    items: {
      total: totalItems,
      last7Days: itemsLast7d,
      previous7Days: itemsPrev7d,
      trend: calculateTrend(itemsLast7d, itemsPrev7d),
    },
    claims: {
      total: totalClaims,
      last7Days: claimsLast7d,
      previous7Days: claimsPrev7d,
      trend: calculateTrend(claimsLast7d, claimsPrev7d),
    },
  };
}
