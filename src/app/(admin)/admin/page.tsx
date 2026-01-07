import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Activity, Server, TrendingUp, AlertTriangle } from "lucide-react";

import { getHealthMetrics } from "@/lib/admin/get-health-metrics";
import { getRecentActivity } from "@/lib/admin/get-recent-activity";
import { getQuickStats } from "@/lib/admin/get-quick-stats";
import { getMrrData, formatCurrency } from "@/lib/admin/get-mrr";

import { HealthIndicatorCard } from "@/components/admin/health-indicator-card";
import { AttentionAlerts, Alert } from "@/components/admin/attention-alerts";
import { ActivityFeed, FormattedActivity } from "@/components/admin/activity-feed";
import { QuickStatsCard } from "@/components/admin/quick-stats";
import { QuickActionsBar } from "@/components/admin/quick-actions-bar";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { ActivityType } from "@prisma/client";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");

  const [healthMetrics, activities, quickStats, mrrData, todayUsers] =
    await Promise.all([
      getHealthMetrics(),
      getRecentActivity(8),
      getQuickStats(),
      getMrrData(),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

  // Count items needing attention
  const attentionCount =
    (healthMetrics.emailQueue.failedCount > 0 ? 1 : 0) +
    (healthMetrics.contactInbox.unansweredCount > 0 ? 1 : 0) +
    (healthMetrics.payments.pastDueCount > 0 ? 1 : 0) +
    (healthMetrics.trials.expiringIn24hCount > 0 ? 1 : 0);

  const getHealthLabel = () => {
    switch (healthMetrics.overall) {
      case "healthy":
        return t("healthIndicators.healthy");
      case "warning":
        return t("healthIndicators.warning");
      case "critical":
        return t("healthIndicators.critical");
    }
  };

  // Build attention alerts with pre-translated strings
  const alerts: Alert[] = [];
  if (healthMetrics.emailQueue.failedCount > 0) {
    alerts.push({
      id: "email-failed",
      type: "email",
      severity: healthMetrics.emailQueue.failedCount > 10 ? "critical" : "warning",
      title: t("alerts.failedEmails.title"),
      description: t("alerts.failedEmails.description", {
        count: healthMetrics.emailQueue.failedCount,
      }),
      href: "/admin/emails?status=failed",
      iconType: "mail",
    });
  }
  if (healthMetrics.contactInbox.unansweredCount > 0) {
    alerts.push({
      id: "contact-unanswered",
      type: "contact",
      severity: healthMetrics.contactInbox.unansweredCount > 5 ? "critical" : "warning",
      title: t("alerts.unansweredContacts.title"),
      description: t("alerts.unansweredContacts.description", {
        count: healthMetrics.contactInbox.unansweredCount,
        hours: Math.round(healthMetrics.contactInbox.oldestUnansweredHours || 0),
      }),
      href: "/admin/contact?status=unanswered",
      iconType: "message",
    });
  }
  if (healthMetrics.payments.pastDueCount > 0) {
    alerts.push({
      id: "payment-past-due",
      type: "payment",
      severity: "critical",
      title: t("alerts.pastDuePayments.title"),
      description: t("alerts.pastDuePayments.description", {
        count: healthMetrics.payments.pastDueCount,
      }),
      href: "/admin/subscriptions?status=past_due",
      iconType: "credit",
    });
  }
  if (healthMetrics.trials.expiringIn24hCount > 0) {
    alerts.push({
      id: "trial-expiring",
      type: "trial",
      severity: "warning",
      title: t("alerts.expiringTrials.title"),
      description: t("alerts.expiringTrials.description", {
        count: healthMetrics.trials.expiringIn24hCount,
      }),
      href: "/admin/subscriptions?status=trialing",
      iconType: "clock",
    });
  }

  // Format activities with translated messages
  const formatActivityMessage = (
    type: ActivityType,
    userName: string | null,
    bubbleName: string | null
  ): string => {
    const user = userName || t("activityFeed.unknownUser");
    const bubble = bubbleName || t("activityFeed.unknownBubble");

    const messageKey = `activityFeed.types.${type}`;
    return t(messageKey, { userName: user, bubbleName: bubble });
  };

  const formattedActivities: FormattedActivity[] = activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    message: formatActivityMessage(activity.type, activity.userName, activity.bubbleName),
    createdAt: activity.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsBar
        labels={{
          title: t("quickActions.title"),
          sendEmail: t("quickActions.sendEmail"),
          viewMessages: t("quickActions.viewMessages"),
          announcements: t("quickActions.announcements"),
          settings: t("quickActions.settings"),
        }}
      />

      {/* Health Indicator Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HealthIndicatorCard
          title={t("healthIndicators.systemHealth")}
          value={getHealthLabel()}
          level={healthMetrics.overall}
          icon={Server}
        />
        <HealthIndicatorCard
          title={t("healthIndicators.todayActivity")}
          value={t("healthIndicators.newUsers", { count: todayUsers })}
          level="healthy"
          icon={Activity}
          href="/admin/users?sort=createdAt&order=desc"
        />
        <HealthIndicatorCard
          title={t("healthIndicators.mrr")}
          value={formatCurrency(mrrData.mrr)}
          subtitle={`${mrrData.activeSubscriptions} active`}
          level="healthy"
          icon={TrendingUp}
          href="/admin/financials"
        />
        <HealthIndicatorCard
          title={t("healthIndicators.attentionNeeded")}
          value={attentionCount}
          subtitle={
            attentionCount > 0
              ? t("healthIndicators.itemsNeedAttention", {
                  count: attentionCount,
                })
              : undefined
          }
          level={
            attentionCount > 2
              ? "critical"
              : attentionCount > 0
                ? "warning"
                : "healthy"
          }
          icon={AlertTriangle}
        />
      </div>

      {/* Attention Alerts */}
      <AttentionAlerts
        alerts={alerts}
        title={t("alerts.title")}
        allClearMessage={t("alerts.allClear")}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <ActivityFeed
          activities={formattedActivities}
          labels={{
            title: t("activityFeed.title"),
            viewAll: t("activityFeed.viewAll"),
            noActivity: t("activityFeed.noActivity"),
          }}
        />

        {/* Quick Stats */}
        <QuickStatsCard
          stats={quickStats}
          labels={{
            title: t("quickStats.title"),
            users: t("quickStats.users"),
            bubbles: t("quickStats.bubbles"),
            items: t("quickStats.items"),
            claims: t("quickStats.claims"),
          }}
        />
      </div>

      {/* Growth Charts */}
      <DashboardCharts />
    </div>
  );
}
