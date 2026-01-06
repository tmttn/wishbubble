"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Crown,
  AlertTriangle,
  ArrowRight,
  Ticket,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface FinancialStats {
  subscriptions: {
    active: number;
    trialing: number;
    canceled: number;
    pastDue: number;
    total: number;
  };
  tiers: {
    premium: number;
    family: number;
    premiumTrialing: number;
    familyTrialing: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    total: number;
    period: number;
    mrr: number;
    arr: number;
  };
  transactions: {
    successful: number;
    failed: number;
    refunds: number;
  };
  growth: {
    newSubscriptions: number;
    canceled: number;
    churnRate: string;
  };
  trials: {
    started: number;
    converted: number;
    conversionRate: string;
  };
  coupons: {
    total: number;
    active: number;
    redemptions: number;
  };
  period: string;
  days: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trendValue) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trendValue && (
              <span
                className={cn(
                  "flex items-center",
                  trend === "up" && "text-green-600",
                  trend === "down" && "text-red-600"
                )}
              >
                {trend === "up" && <TrendingUp className="h-3 w-3 mr-0.5" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 mr-0.5" />}
                {trendValue}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function FinancialsPage() {
  const t = useTranslations("admin.financialsPage");
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/stats/financial?period=${period}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "FinancialsPage", action: "fetchStats" } });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const mrrGrowth =
    stats.revenue.lastMonth > 0
      ? (
          ((stats.revenue.thisMonth - stats.revenue.lastMonth) /
            stats.revenue.lastMonth) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t("periods.7d")}</SelectItem>
            <SelectItem value="30d">{t("periods.30d")}</SelectItem>
            <SelectItem value="90d">{t("periods.90d")}</SelectItem>
            <SelectItem value="1y">{t("periods.1y")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title={t("mrr")}
          value={formatCurrency(stats.revenue.mrr)}
          icon={Euro}
          trend={parseFloat(mrrGrowth) > 0 ? "up" : parseFloat(mrrGrowth) < 0 ? "down" : "neutral"}
          trendValue={`${mrrGrowth}%`}
          description={t("vsLastMonth")}
        />
        <StatCard
          title={t("arr")}
          value={formatCurrency(stats.revenue.arr)}
          icon={TrendingUp}
          description={t("projectedYearly")}
        />
        <StatCard
          title={t("activeSubscriptions")}
          value={stats.subscriptions.total}
          icon={Users}
          description={t("inTrial", { count: stats.subscriptions.trialing })}
        />
        <StatCard
          title={t("churnRate")}
          value={`${stats.growth.churnRate}%`}
          icon={AlertTriangle}
          trend={parseFloat(stats.growth.churnRate) > 5 ? "down" : "up"}
          description={t("canceledInPeriod", { count: stats.growth.canceled })}
        />
      </div>

      {/* Subscriptions & Revenue */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Subscriptions Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              {t("subscriptions.title")}
            </CardTitle>
            <CardDescription>{t("subscriptions.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {t("subscriptions.active")}
                </Badge>
                <span className="text-sm">{t("subscriptions.payingCustomers")}</span>
              </div>
              <span className="font-semibold">{stats.subscriptions.active}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t("subscriptions.trialing")}</Badge>
                <span className="text-sm">{t("subscriptions.freeTrial")}</span>
              </div>
              <span className="font-semibold">{stats.subscriptions.trialing}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {t("subscriptions.pastDue")}
                </Badge>
                <span className="text-sm">{t("subscriptions.paymentFailed")}</span>
              </div>
              <span className="font-semibold">{stats.subscriptions.pastDue}</span>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">{t("subscriptions.byPlan")}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("subscriptions.premium")}</span>
                  <span className="font-medium">{stats.tiers.premium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("subscriptions.family")}</span>
                  <span className="font-medium">{stats.tiers.family}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              {t("revenue.title")}
            </CardTitle>
            <CardDescription>{t("revenue.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">{t("revenue.thisMonth")}</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(stats.revenue.thisMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">{t("revenue.lastMonth")}</span>
              <span className="font-semibold">
                {formatCurrency(stats.revenue.lastMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">{t("revenue.periodTotal", { days: stats.days })}</span>
              <span className="font-semibold">
                {formatCurrency(stats.revenue.period)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("revenue.lifetime")}</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(stats.revenue.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions & Trials */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("transactions.title")}
            </CardTitle>
            <CardDescription>{t("transactions.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t("transactions.successful")}</span>
              </div>
              <span className="font-semibold">{stats.transactions.successful}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">{t("transactions.failed")}</span>
              </div>
              <span className="font-semibold">{stats.transactions.failed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{t("transactions.refunds")}</span>
              </div>
              <span className="font-semibold">{stats.transactions.refunds}</span>
            </div>
          </CardContent>
        </Card>

        {/* Trial Conversions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("trials.title")}</CardTitle>
            <CardDescription>{t("trials.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {stats.trials.conversionRate}%
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>{t("trials.started")}</span>
                <span>{stats.trials.started}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("trials.converted")}</span>
                <span>{stats.trials.converted}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupons */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                {t("coupons.title")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/coupons">
                  {t("coupons.manage")}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>{t("coupons.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("coupons.activeCoupons")}</span>
              <span className="font-semibold">{stats.coupons.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("coupons.redemptions")}</span>
              <span className="font-semibold">{stats.coupons.redemptions}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth */}
      <Card>
        <CardHeader>
          <CardTitle>{t("growth.title")}</CardTitle>
          <CardDescription>{t("growth.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                +{stats.growth.newSubscriptions}
              </div>
              <div className="text-sm text-muted-foreground">{t("growth.newSubscriptions")}</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                -{stats.growth.canceled}
              </div>
              <div className="text-sm text-muted-foreground">{t("growth.canceled")}</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {stats.growth.newSubscriptions - stats.growth.canceled > 0 ? "+" : ""}
                {stats.growth.newSubscriptions - stats.growth.canceled}
              </div>
              <div className="text-sm text-muted-foreground">{t("growth.netGrowth")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
