import { prisma } from "@/lib/db";
import { getHealthMetrics } from "./get-health-metrics";
import { getMrrData, formatCurrency } from "./get-mrr";
import { HealthLevel } from "./health-status";

export interface OwnerDigestData {
  period: "daily" | "weekly";
  periodLabel: string;
  health: {
    system: { level: HealthLevel; label: string };
    email: { level: HealthLevel; label: string; failedCount: number };
    contacts: { level: HealthLevel; unansweredCount: number };
  };
  growth: {
    users: { total: number; change: number };
    bubbles: { total: number; change: number };
    items: { total: number; change: number };
    claims: { total: number; change: number };
  };
  business: {
    mrr: string;
    mrrCents: number;
    activeSubscriptions: number;
    conversionRate: number; // Percentage of users who are paying
  };
  highlights: string[];
  hasActivity: boolean;
}

export async function getOwnerDigestData(
  period: "daily" | "weekly"
): Promise<OwnerDigestData> {
  const now = new Date();
  const periodDays = period === "daily" ? 1 : 7;
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(
    periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000
  );

  // Get health metrics
  const healthMetrics = await getHealthMetrics();

  // Get MRR data
  const mrrData = await getMrrData();

  // Get period stats
  const [
    totalUsers,
    usersThisPeriod,
    usersPrevPeriod,
    totalBubbles,
    bubblesThisPeriod,
    bubblesPrevPeriod,
    totalItems,
    itemsThisPeriod,
    itemsPrevPeriod,
    totalClaims,
    claimsThisPeriod,
    claimsPrevPeriod,
    paidUsers,
  ] = await Promise.all([
    // Users
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: periodStart } },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: previousPeriodStart, lt: periodStart },
      },
    }),
    // Bubbles
    prisma.bubble.count({ where: { archivedAt: null } }),
    prisma.bubble.count({
      where: { archivedAt: null, createdAt: { gte: periodStart } },
    }),
    prisma.bubble.count({
      where: {
        archivedAt: null,
        createdAt: { gte: previousPeriodStart, lt: periodStart },
      },
    }),
    // Items
    prisma.wishlistItem.count({ where: { deletedAt: null } }),
    prisma.wishlistItem.count({
      where: { deletedAt: null, createdAt: { gte: periodStart } },
    }),
    prisma.wishlistItem.count({
      where: {
        deletedAt: null,
        createdAt: { gte: previousPeriodStart, lt: periodStart },
      },
    }),
    // Claims
    prisma.claim.count(),
    prisma.claim.count({ where: { claimedAt: { gte: periodStart } } }),
    prisma.claim.count({
      where: { claimedAt: { gte: previousPeriodStart, lt: periodStart } },
    }),
    // Paid users count
    prisma.user.count({
      where: {
        deletedAt: null,
        subscriptionTier: { in: ["PLUS", "COMPLETE"] },
      },
    }),
  ]);

  // Calculate changes
  const userChange = usersThisPeriod - usersPrevPeriod;
  const bubbleChange = bubblesThisPeriod - bubblesPrevPeriod;
  const itemChange = itemsThisPeriod - itemsPrevPeriod;
  const claimChange = claimsThisPeriod - claimsPrevPeriod;

  // Calculate conversion rate
  const conversionRate =
    totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 1000) / 10 : 0;

  // Build highlights
  const highlights: string[] = [];

  // New user milestone
  if (usersThisPeriod > 0) {
    highlights.push(`${usersThisPeriod} new user${usersThisPeriod !== 1 ? "s" : ""} registered`);
  }

  // Significant growth
  if (userChange > usersPrevPeriod && usersPrevPeriod > 0) {
    highlights.push("User growth doubled compared to previous period!");
  }

  // New bubbles
  if (bubblesThisPeriod > 0) {
    highlights.push(`${bubblesThisPeriod} new group${bubblesThisPeriod !== 1 ? "s" : ""} created`);
  }

  // Claims activity
  if (claimsThisPeriod > 10) {
    highlights.push(`High gift claiming activity: ${claimsThisPeriod} claims`);
  }

  // Health warnings
  if (healthMetrics.overall === "critical") {
    highlights.push("⚠️ System health needs attention");
  }

  // Contact messages
  if (healthMetrics.contactInbox.unansweredCount > 0) {
    highlights.push(
      `${healthMetrics.contactInbox.unansweredCount} contact message${healthMetrics.contactInbox.unansweredCount !== 1 ? "s" : ""} awaiting response`
    );
  }

  // Failed emails
  if (healthMetrics.emailQueue.failedCount > 0) {
    highlights.push(
      `${healthMetrics.emailQueue.failedCount} failed email${healthMetrics.emailQueue.failedCount !== 1 ? "s" : ""} in queue`
    );
  }

  // Check if there's any activity worth reporting
  const hasActivity =
    usersThisPeriod > 0 ||
    bubblesThisPeriod > 0 ||
    itemsThisPeriod > 0 ||
    claimsThisPeriod > 0 ||
    healthMetrics.overall !== "healthy" ||
    healthMetrics.contactInbox.unansweredCount > 0;

  // Build period label
  const periodLabel =
    period === "daily"
      ? now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : `Week of ${periodStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;

  return {
    period,
    periodLabel,
    health: {
      system: {
        level: healthMetrics.overall,
        label: healthMetrics.overall === "healthy" ? "All systems operational" :
               healthMetrics.overall === "warning" ? "Minor issues detected" :
               "Critical issues need attention",
      },
      email: {
        level: healthMetrics.emailQueue.level,
        label: healthMetrics.emailQueue.level === "healthy" ? "Delivery normal" :
               healthMetrics.emailQueue.level === "warning" ? "Some failures" :
               "Delivery issues",
        failedCount: healthMetrics.emailQueue.failedCount,
      },
      contacts: {
        level: healthMetrics.contactInbox.level,
        unansweredCount: healthMetrics.contactInbox.unansweredCount,
      },
    },
    growth: {
      users: { total: totalUsers, change: userChange },
      bubbles: { total: totalBubbles, change: bubbleChange },
      items: { total: totalItems, change: itemChange },
      claims: { total: totalClaims, change: claimChange },
    },
    business: {
      mrr: formatCurrency(mrrData.mrr),
      mrrCents: mrrData.mrr,
      activeSubscriptions: mrrData.activeSubscriptions,
      conversionRate,
    },
    highlights,
    hasActivity,
  };
}
