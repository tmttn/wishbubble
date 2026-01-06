# Phase 2: Smart Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the admin dashboard from raw stats display into a morning check-in tool that answers "Is everything okay? What needs attention?"

**Architecture:** Server-side data fetching for health metrics, client components for interactivity. Health status derived from EmailQueue failures, unanswered ContactSubmissions, payment issues, and expiring trials.

**Tech Stack:** Next.js 15, React 19, Prisma ORM, shadcn/ui components, next-intl, Tailwind CSS

---

## Task 1: Create Health Status Types and Utilities

**Files:**
- Create: `src/lib/admin/health-status.ts`

**Step 1: Create the health status utility file**

```typescript
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

export function deriveOverallHealth(metrics: Omit<HealthMetrics, "overall">): HealthLevel {
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
    case "healthy": return "text-green-500";
    case "warning": return "text-yellow-500";
    case "critical": return "text-red-500";
  }
}

export function getHealthLevelBgColor(level: HealthLevel): string {
  switch (level) {
    case "healthy": return "bg-green-500/10";
    case "warning": return "bg-yellow-500/10";
    case "critical": return "bg-red-500/10";
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/admin/health-status.ts
git commit -m "feat(admin): add health status types and utilities"
```

---

## Task 2: Create Health Metrics Data Fetching

**Files:**
- Create: `src/lib/admin/get-health-metrics.ts`

**Step 1: Create the data fetching function**

```typescript
import { prisma } from "@/lib/db";
import { HealthMetrics, HealthLevel, deriveOverallHealth } from "./health-status";

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
    // Past due subscriptions
    prisma.subscription.count({
      where: { status: "PAST_DUE" },
    }),
    // Trials expiring in 24h
    prisma.subscription.count({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: now,
          lt: hours24FromNow,
        },
      },
    }),
    // Trials expiring in 7d
    prisma.subscription.count({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: now,
          lt: days7FromNow,
        },
      },
    }),
  ]);

  // Calculate oldest unanswered age in hours
  const oldestUnansweredHours = oldestUnanswered
    ? Math.floor((now.getTime() - oldestUnanswered.createdAt.getTime()) / (1000 * 60 * 60))
    : null;

  // Derive health levels
  const emailQueueLevel: HealthLevel =
    failedEmails > 10 ? "critical" :
    failedEmails > 0 ? "warning" : "healthy";

  const contactInboxLevel: HealthLevel =
    unansweredContacts > 5 ? "critical" :
    unansweredContacts > 0 ? "warning" : "healthy";

  const paymentsLevel: HealthLevel =
    pastDueSubscriptions > 5 ? "critical" :
    pastDueSubscriptions > 0 ? "warning" : "healthy";

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
```

**Step 2: Commit**

```bash
git add src/lib/admin/get-health-metrics.ts
git commit -m "feat(admin): add health metrics data fetching"
```

---

## Task 3: Create Health Indicator Card Component

**Files:**
- Create: `src/components/admin/health-indicator-card.tsx`

**Step 1: Create the component**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HealthLevel, getHealthLevelColor, getHealthLevelBgColor } from "@/lib/admin/health-status";
import { LucideIcon, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

interface HealthIndicatorCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  level: HealthLevel;
  icon: LucideIcon;
  href?: string;
}

function getStatusIcon(level: HealthLevel) {
  switch (level) {
    case "healthy": return CheckCircle2;
    case "warning": return AlertTriangle;
    case "critical": return AlertCircle;
  }
}

export function HealthIndicatorCard({
  title,
  value,
  subtitle,
  level,
  icon: Icon,
  href,
}: HealthIndicatorCardProps) {
  const StatusIcon = getStatusIcon(level);

  const CardWrapper = href ? "a" : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <CardWrapper {...wrapperProps} className={href ? "block" : ""}>
      <Card className={cn(
        "border-0 backdrop-blur-sm transition-colors",
        getHealthLevelBgColor(level),
        href && "hover:bg-opacity-20 cursor-pointer"
      )}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", getHealthLevelColor(level))} />
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className={cn("text-xs mt-1", getHealthLevelColor(level))}>
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/health-indicator-card.tsx
git commit -m "feat(admin): add health indicator card component"
```

---

## Task 4: Create Attention Needed Alerts Component

**Files:**
- Create: `src/components/admin/attention-alerts.tsx`

**Step 1: Create the component**

```typescript
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Mail, MessageSquare, CreditCard, Clock } from "lucide-react";
import { HealthMetrics } from "@/lib/admin/health-status";

interface AttentionAlertsProps {
  metrics: HealthMetrics;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface Alert {
  id: string;
  type: "email" | "contact" | "payment" | "trial";
  severity: "warning" | "critical";
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

export function AttentionAlerts({ metrics, t }: AttentionAlertsProps) {
  const alerts: Alert[] = [];

  // Failed emails
  if (metrics.emailQueue.failedCount > 0) {
    alerts.push({
      id: "failed-emails",
      type: "email",
      severity: metrics.emailQueue.level === "critical" ? "critical" : "warning",
      title: t("alerts.failedEmails.title"),
      description: t("alerts.failedEmails.description", { count: metrics.emailQueue.failedCount }),
      href: "/admin/email-queue?status=FAILED",
      icon: Mail,
    });
  }

  // Unanswered contacts
  if (metrics.contactInbox.unansweredCount > 0) {
    alerts.push({
      id: "unanswered-contacts",
      type: "contact",
      severity: metrics.contactInbox.level === "critical" ? "critical" : "warning",
      title: t("alerts.unansweredContacts.title"),
      description: t("alerts.unansweredContacts.description", {
        count: metrics.contactInbox.unansweredCount,
        hours: metrics.contactInbox.oldestUnansweredHours ?? 0,
      }),
      href: "/admin/contact?status=NEW",
      icon: MessageSquare,
    });
  }

  // Past due payments
  if (metrics.payments.pastDueCount > 0) {
    alerts.push({
      id: "past-due-payments",
      type: "payment",
      severity: metrics.payments.level === "critical" ? "critical" : "warning",
      title: t("alerts.pastDuePayments.title"),
      description: t("alerts.pastDuePayments.description", { count: metrics.payments.pastDueCount }),
      href: "/admin/financials?status=PAST_DUE",
      icon: CreditCard,
    });
  }

  // Expiring trials
  if (metrics.trials.expiringIn24hCount > 0) {
    alerts.push({
      id: "expiring-trials",
      type: "trial",
      severity: "warning",
      title: t("alerts.expiringTrials.title"),
      description: t("alerts.expiringTrials.description", { count: metrics.trials.expiringIn24hCount }),
      href: "/admin/users?trialExpiring=24h",
      icon: Clock,
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <CardTitle className="text-lg">{t("alerts.title")}</CardTitle>
        <Badge variant="secondary" className="ml-auto">
          {alerts.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.href}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg transition-colors",
              alert.severity === "critical"
                ? "bg-red-500/10 hover:bg-red-500/20"
                : "bg-yellow-500/10 hover:bg-yellow-500/20"
            )}
          >
            <alert.icon className={cn(
              "h-5 w-5 mt-0.5 shrink-0",
              alert.severity === "critical" ? "text-red-500" : "text-yellow-500"
            )} />
            <div className="min-w-0">
              <p className="font-medium text-sm">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alert.description}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/attention-alerts.tsx
git commit -m "feat(admin): add attention alerts component"
```

---

## Task 5: Create Activity Feed Component

**Files:**
- Create: `src/lib/admin/get-recent-activity.ts`
- Create: `src/components/admin/activity-feed.tsx`

**Step 1: Create data fetching function**

```typescript
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

export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
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
```

**Step 2: Create activity feed component**

```typescript
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  UserPlus, LogIn, Gift, ShoppingCart,
  Users, Mail, CreditCard, Bell, Activity
} from "lucide-react";
import { ActivityType } from "@prisma/client";
import { ActivityItem } from "@/lib/admin/get-recent-activity";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: ActivityItem[];
  t: (key: string, values?: Record<string, string | number>) => string;
}

const activityIcons: Partial<Record<ActivityType, React.ElementType>> = {
  USER_REGISTERED: UserPlus,
  USER_LOGIN: LogIn,
  ITEM_CREATED: Gift,
  ITEM_CLAIMED: ShoppingCart,
  ITEM_PURCHASED: ShoppingCart,
  BUBBLE_CREATED: Users,
  MEMBER_JOINED: Users,
  SUBSCRIPTION_CREATED: CreditCard,
  SUBSCRIPTION_RENEWED: CreditCard,
  SUBSCRIPTION_CANCELED: CreditCard,
};

function getActivityIcon(type: ActivityType) {
  return activityIcons[type] || Activity;
}

function formatActivityMessage(
  activity: ActivityItem,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  const userName = activity.userName || activity.userEmail || t("activityFeed.unknownUser");
  const bubbleName = activity.bubbleName || t("activityFeed.unknownBubble");

  // Use translation keys for each activity type
  const key = `activityFeed.types.${activity.type}`;
  return t(key, { userName, bubbleName });
}

export function ActivityFeed({ activities, t }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t("activityFeed.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("activityFeed.noActivity")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t("activityFeed.title")}</CardTitle>
        <Link
          href="/admin/activity"
          className="text-sm text-primary hover:underline"
        >
          {t("activityFeed.viewAll")}
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const message = formatActivityMessage(activity, t);

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="p-2 rounded-full bg-secondary/50">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/admin/get-recent-activity.ts src/components/admin/activity-feed.tsx
git commit -m "feat(admin): add activity feed component"
```

---

## Task 6: Create Quick Stats Component with Trends

**Files:**
- Create: `src/lib/admin/get-quick-stats.ts`
- Create: `src/components/admin/quick-stats.tsx`

**Step 1: Create data fetching function**

```typescript
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
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: days7Ago } } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: days14Ago, lt: days7Ago } } }),
    // Bubbles
    prisma.bubble.count({ where: { archivedAt: null } }),
    prisma.bubble.count({ where: { archivedAt: null, createdAt: { gte: days7Ago } } }),
    prisma.bubble.count({ where: { archivedAt: null, createdAt: { gte: days14Ago, lt: days7Ago } } }),
    // Items
    prisma.wishlistItem.count({ where: { deletedAt: null } }),
    prisma.wishlistItem.count({ where: { deletedAt: null, createdAt: { gte: days7Ago } } }),
    prisma.wishlistItem.count({ where: { deletedAt: null, createdAt: { gte: days14Ago, lt: days7Ago } } }),
    // Claims
    prisma.claim.count(),
    prisma.claim.count({ where: { claimedAt: { gte: days7Ago } } }),
    prisma.claim.count({ where: { claimedAt: { gte: days14Ago, lt: days7Ago } } }),
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
```

**Step 2: Create quick stats component**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Users, Users2, Gift, ShoppingCart } from "lucide-react";
import { QuickStats } from "@/lib/admin/get-quick-stats";

interface QuickStatsCardProps {
  stats: QuickStats;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface StatItemProps {
  label: string;
  total: number;
  last7Days: number;
  trend: number;
  icon: React.ElementType;
}

function StatItem({ label, total, last7Days, trend, icon: Icon }: StatItemProps) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">+{last7Days} (7d)</p>
        <p className={cn("text-sm flex items-center gap-1 justify-end", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          {trend > 0 ? "+" : ""}{trend}%
        </p>
      </div>
    </div>
  );
}

export function QuickStatsCard({ stats, t }: QuickStatsCardProps) {
  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t("quickStats.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatItem
          label={t("quickStats.users")}
          total={stats.users.total}
          last7Days={stats.users.last7Days}
          trend={stats.users.trend}
          icon={Users}
        />
        <StatItem
          label={t("quickStats.bubbles")}
          total={stats.bubbles.total}
          last7Days={stats.bubbles.last7Days}
          trend={stats.bubbles.trend}
          icon={Users2}
        />
        <StatItem
          label={t("quickStats.items")}
          total={stats.items.total}
          last7Days={stats.items.last7Days}
          trend={stats.items.trend}
          icon={Gift}
        />
        <StatItem
          label={t("quickStats.claims")}
          total={stats.claims.total}
          last7Days={stats.claims.last7Days}
          trend={stats.claims.trend}
          icon={ShoppingCart}
        />
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/admin/get-quick-stats.ts src/components/admin/quick-stats.tsx
git commit -m "feat(admin): add quick stats component with trends"
```

---

## Task 7: Create MRR Calculation Utility

**Files:**
- Create: `src/lib/admin/get-mrr.ts`

**Step 1: Create MRR utility**

```typescript
import { prisma } from "@/lib/db";

export interface MrrData {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  monthlySubscriptions: number;
  yearlySubscriptions: number;
}

// Price mapping - ideally this would come from Stripe or config
const PRICE_MAP: Record<string, { amount: number; interval: "monthly" | "yearly" }> = {
  // Add your actual Stripe price IDs here
  // Example: "price_xxx": { amount: 499, interval: "monthly" }
};

export async function getMrrData(): Promise<MrrData> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    select: {
      stripePriceId: true,
      interval: true,
    },
  });

  let mrr = 0;
  let monthlyCount = 0;
  let yearlyCount = 0;

  for (const sub of subscriptions) {
    const priceInfo = PRICE_MAP[sub.stripePriceId];

    if (priceInfo) {
      if (priceInfo.interval === "monthly") {
        mrr += priceInfo.amount;
        monthlyCount++;
      } else {
        mrr += Math.round(priceInfo.amount / 12);
        yearlyCount++;
      }
    } else {
      // Fallback: estimate based on interval
      // Assuming €4.99/month or €49.99/year as defaults
      if (sub.interval === "MONTHLY") {
        mrr += 499;
        monthlyCount++;
      } else {
        mrr += Math.round(4999 / 12);
        yearlyCount++;
      }
    }
  }

  return {
    mrr,
    arr: mrr * 12,
    activeSubscriptions: subscriptions.length,
    monthlySubscriptions: monthlyCount,
    yearlySubscriptions: yearlyCount,
  };
}

export function formatCurrency(cents: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
```

**Step 2: Commit**

```bash
git add src/lib/admin/get-mrr.ts
git commit -m "feat(admin): add MRR calculation utility"
```

---

## Task 8: Add Dashboard Translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/nl.json`

**Step 1: Add English translations**

Add to admin.dashboard section in en.json:

```json
{
  "admin": {
    "dashboard": {
      "title": "Admin Dashboard",
      "subtitle": "Platform overview and quick health check",
      "healthIndicators": {
        "systemHealth": "System Health",
        "healthy": "Healthy",
        "warning": "Needs attention",
        "critical": "Critical",
        "todayActivity": "Today",
        "newUsers": "+{count} users",
        "mrr": "MRR",
        "attentionNeeded": "Attention Needed",
        "itemsNeedAttention": "{count} items need attention"
      },
      "alerts": {
        "title": "Attention Needed",
        "failedEmails": {
          "title": "Failed Emails",
          "description": "{count} emails failed to send"
        },
        "unansweredContacts": {
          "title": "Unanswered Messages",
          "description": "{count} messages waiting (oldest: {hours}h)"
        },
        "pastDuePayments": {
          "title": "Past Due Payments",
          "description": "{count} subscriptions past due"
        },
        "expiringTrials": {
          "title": "Expiring Trials",
          "description": "{count} trials expire in 24h"
        }
      },
      "activityFeed": {
        "title": "Recent Activity",
        "viewAll": "View all",
        "noActivity": "No recent activity",
        "unknownUser": "Unknown user",
        "unknownBubble": "Unknown bubble",
        "types": {
          "USER_REGISTERED": "{userName} signed up",
          "USER_LOGIN": "{userName} logged in",
          "ITEM_CREATED": "{userName} added a wish",
          "ITEM_CLAIMED": "{userName} claimed an item",
          "ITEM_PURCHASED": "{userName} purchased an item",
          "BUBBLE_CREATED": "{userName} created {bubbleName}",
          "MEMBER_JOINED": "{userName} joined {bubbleName}",
          "SUBSCRIPTION_CREATED": "{userName} subscribed",
          "SUBSCRIPTION_RENEWED": "{userName} renewed subscription",
          "SUBSCRIPTION_CANCELED": "{userName} canceled subscription"
        }
      },
      "quickStats": {
        "title": "Quick Stats (7 days)",
        "users": "Users",
        "bubbles": "Bubbles",
        "items": "Items",
        "claims": "Claims"
      }
    }
  }
}
```

**Step 2: Add Dutch translations**

Add same structure to nl.json with Dutch translations.

**Step 3: Commit**

```bash
git add messages/en.json messages/nl.json
git commit -m "feat(admin): add dashboard translations for Phase 2"
```

---

## Task 9: Update Dashboard Page with New Components

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`

**Step 1: Update the dashboard page**

Replace the existing dashboard page with:

```typescript
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

  const [healthMetrics, activities, quickStats, mrrData, todayUsers] = await Promise.all([
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
      case "healthy": return t("healthIndicators.healthy");
      case "warning": return t("healthIndicators.warning");
      case "critical": return t("healthIndicators.critical");
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
          subtitle={attentionCount > 0 ? t("healthIndicators.itemsNeedAttention", { count: attentionCount }) : undefined}
          level={attentionCount > 2 ? "critical" : attentionCount > 0 ? "warning" : "healthy"}
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
```

**Step 2: Commit**

```bash
git add src/app/(admin)/admin/page.tsx
git commit -m "feat(admin): update dashboard with health indicators and activity feed"
```

---

## Task 10: Add Index File for Admin Utilities

**Files:**
- Create: `src/lib/admin/index.ts`

**Step 1: Create index file**

```typescript
export * from "./health-status";
export * from "./get-health-metrics";
export * from "./get-recent-activity";
export * from "./get-quick-stats";
export * from "./get-mrr";
```

**Step 2: Commit**

```bash
git add src/lib/admin/index.ts
git commit -m "feat(admin): add index file for admin utilities"
```

---

## Task 11: Test and Verify

**Step 1: Run type check**

```bash
npx tsc --noEmit
```

**Step 2: Run linter**

```bash
npm run lint
```

**Step 3: Run dev server and test manually**

```bash
npm run dev
```

Verify:
- Dashboard loads without errors
- Health indicators show correct status
- Attention alerts appear when there are issues
- Activity feed shows recent activities
- Quick stats show correct numbers with trends
- MRR displays correctly

**Step 4: Final commit if needed**

```bash
git add -A
git commit -m "fix(admin): address any lint/type issues from Phase 2"
```

---

## Summary

Phase 2 creates a Smart Dashboard with:
1. **Health indicator cards** - System health, today's activity, MRR, attention count
2. **Attention needed alerts** - Failed emails, unanswered contacts, past due payments, expiring trials
3. **Activity feed** - Human-readable feed of recent platform activity
4. **Quick stats** - Users, bubbles, items, claims with 7-day trends
5. **Existing charts** - Growth charts remain below the new components
