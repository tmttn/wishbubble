import { prisma } from "@/lib/db";
import {
  HealthMetrics,
  HealthLevel,
  deriveOverallHealth,
} from "./health-status";

export async function getHealthMetrics(): Promise<HealthMetrics> {
  const now = new Date();
  const hours48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const hours24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const days7FromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    failedEmails,
    pendingEmails,
    unansweredContacts,
    oldestUnanswered,
    pastDueSubscriptions,
    expiringTrials24h,
    expiringTrials7d,
  ] = await Promise.all([
    // Failed emails
    prisma.emailQueue.count({
      where: { status: "FAILED" },
    }),
    // Pending emails
    prisma.emailQueue.count({
      where: { status: "PENDING" },
    }),
    // Unanswered contacts (NEW status, older than 48h)
    prisma.contactSubmission.count({
      where: {
        status: "NEW",
        createdAt: { lt: hours48Ago },
      },
    }),
    // Oldest unanswered contact
    prisma.contactSubmission.findFirst({
      where: { status: "NEW" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    // Past due subscriptions (exclude admin-managed subscriptions)
    prisma.subscription.count({
      where: {
        status: "PAST_DUE",
        NOT: { stripeSubscriptionId: { startsWith: "admin_" } },
      },
    }),
    // Trials expiring in 24h (exclude admin-managed subscriptions)
    prisma.subscription.count({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: now,
          lt: hours24FromNow,
        },
        NOT: { stripeSubscriptionId: { startsWith: "admin_" } },
      },
    }),
    // Trials expiring in 7d (exclude admin-managed subscriptions)
    prisma.subscription.count({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: now,
          lt: days7FromNow,
        },
        NOT: { stripeSubscriptionId: { startsWith: "admin_" } },
      },
    }),
  ]);

  // Calculate oldest unanswered age in hours
  const oldestUnansweredHours = oldestUnanswered
    ? Math.floor(
        (now.getTime() - oldestUnanswered.createdAt.getTime()) /
          (1000 * 60 * 60)
      )
    : null;

  // Derive health levels
  const emailQueueLevel: HealthLevel =
    failedEmails > 10 ? "critical" : failedEmails > 0 ? "warning" : "healthy";

  const contactInboxLevel: HealthLevel =
    unansweredContacts > 5
      ? "critical"
      : unansweredContacts > 0
        ? "warning"
        : "healthy";

  const paymentsLevel: HealthLevel =
    pastDueSubscriptions > 5
      ? "critical"
      : pastDueSubscriptions > 0
        ? "warning"
        : "healthy";

  const trialsLevel: HealthLevel =
    expiringTrials24h > 0 ? "warning" : "healthy";

  const metrics: Omit<HealthMetrics, "overall"> = {
    emailQueue: {
      level: emailQueueLevel,
      failedCount: failedEmails,
      pendingCount: pendingEmails,
    },
    contactInbox: {
      level: contactInboxLevel,
      unansweredCount: unansweredContacts,
      oldestUnansweredHours,
    },
    payments: {
      level: paymentsLevel,
      failedCount: 0, // Would need payment failure tracking
      pastDueCount: pastDueSubscriptions,
    },
    trials: {
      level: trialsLevel,
      expiringIn24hCount: expiringTrials24h,
      expiringIn7dCount: expiringTrials7d,
    },
  };

  return {
    ...metrics,
    overall: deriveOverallHealth(metrics),
  };
}
