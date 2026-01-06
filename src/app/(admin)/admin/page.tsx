import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Activity, Server, TrendingUp, AlertTriangle } from "lucide-react";

import { getHealthMetrics } from "@/lib/admin/get-health-metrics";
import { getRecentActivity } from "@/lib/admin/get-recent-activity";
import { getQuickStats } from "@/lib/admin/get-quick-stats";
import { getMrrData, formatCurrency } from "@/lib/admin/get-mrr";

import { HealthIndicatorCard } from "@/components/admin/health-indicator-card";
import { AttentionAlerts } from "@/components/admin/attention-alerts";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { QuickStatsCard } from "@/components/admin/quick-stats";
import { DashboardCharts } from "@/components/admin/dashboard-charts";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

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
      <AttentionAlerts metrics={healthMetrics} t={t} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <ActivityFeed activities={activities} t={t} />

        {/* Quick Stats */}
        <QuickStatsCard stats={quickStats} t={t} />
      </div>

      {/* Growth Charts */}
      <DashboardCharts />
    </div>
  );
}
