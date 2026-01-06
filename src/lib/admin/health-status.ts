// Health status types and derivation logic

export type HealthLevel = "healthy" | "warning" | "critical";

export interface HealthMetrics {
  emailQueue: {
    level: HealthLevel;
    failedCount: number;
    pendingCount: number;
  };
  contactInbox: {
    level: HealthLevel;
    unansweredCount: number;
    oldestUnansweredHours: number | null;
  };
  payments: {
    level: HealthLevel;
    failedCount: number;
    pastDueCount: number;
  };
  trials: {
    level: HealthLevel;
    expiringIn24hCount: number;
    expiringIn7dCount: number;
  };
  overall: HealthLevel;
}

export function deriveOverallHealth(
  metrics: Omit<HealthMetrics, "overall">
): HealthLevel {
  const levels = [
    metrics.emailQueue.level,
    metrics.contactInbox.level,
    metrics.payments.level,
    metrics.trials.level,
  ];

  if (levels.includes("critical")) return "critical";
  if (levels.includes("warning")) return "warning";
  return "healthy";
}

export function getHealthLevelColor(level: HealthLevel): string {
  switch (level) {
    case "healthy":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "critical":
      return "text-red-500";
  }
}

export function getHealthLevelBgColor(level: HealthLevel): string {
  switch (level) {
    case "healthy":
      return "bg-green-500/10";
    case "warning":
      return "bg-yellow-500/10";
    case "critical":
      return "bg-red-500/10";
  }
}
