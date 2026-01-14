"use client";

import { useEffect, useState, useTransition } from "react";
import { GrowthChart, MultiLineChart, YoYComparisonChart } from "./growth-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";

interface GrowthData {
  date: string;
  dateKey: string;
  users: number;
  groups: number;
  items: number;
  claims: number;
  newUsers: number;
  newGroups: number;
  newItems: number;
  newClaims: number;
}

interface StatsResponse {
  growthData: GrowthData[];
  lastYearGrowthData: GrowthData[];
  period: string;
  granularity: string;
  today: { users: number; groups: number; claims: number };
  week: { users: number; groups: number; claims: number };
  month: { users: number; groups: number; claims: number };
  periodTotals: { users: number; groups: number; items: number; claims: number };
  lastYearPeriodTotals: { users: number; groups: number; items: number; claims: number };
  yoy: { users: string | null; groups: string | null; claims: string | null };
}

export function DashboardCharts() {
  const t = useTypedTranslations("admin.charts");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState("30d");
  const [showYoY, setShowYoY] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const periods = [
    { value: "7d", label: t("periods.7d") },
    { value: "30d", label: t("periods.30d") },
    { value: "90d", label: t("periods.90d") },
    { value: "1y", label: t("periods.1y") },
    { value: "2y", label: t("periods.2y") },
    { value: "all", label: t("periods.all") },
  ];

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/stats?period=${period}&granularity=auto`);
        const result = await res.json();
        if (!cancelled) {
          startTransition(() => {
            setData(result);
            setInitialLoading(false);
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setInitialLoading(false);
          });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const loading = initialLoading || isPending;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {periods.slice(0, 4).map((p) => (
              <div key={p.value} className="h-9 w-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="py-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-6">
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const getTrend = (value: number) => {
    if (value > 0) return { icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" };
    if (value < 0) return { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" };
    return { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" };
  };

  const getYoYTrend = (value: string | null) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (num > 0) return { value: `+${value}%`, color: "text-accent" };
    if (num < 0) return { value: `${value}%`, color: "text-red-500" };
    return { value: "0%", color: "text-muted-foreground" };
  };

  const todayStats = [
    {
      label: t("newUsers"),
      today: data.today.users,
      week: data.week.users,
      month: data.month.users,
      yoy: getYoYTrend(data.yoy.users),
    },
    {
      label: t("newGroups"),
      today: data.today.groups,
      week: data.week.groups,
      month: data.month.groups,
      yoy: getYoYTrend(data.yoy.groups),
    },
    {
      label: t("newClaims"),
      today: data.today.claims,
      week: data.week.claims,
      month: data.month.claims,
      yoy: getYoYTrend(data.yoy.claims),
    },
  ];

  const periodLabel = periods.find((p) => p.value === period)?.label || period;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className="rounded-lg"
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Button
          variant={showYoY ? "default" : "outline"}
          size="sm"
          onClick={() => setShowYoY(!showYoY)}
          className="rounded-lg"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {t("compareYoY")}
        </Button>
      </div>

      {/* Today's Activity with YoY */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("activitySummary")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {todayStats.map((stat) => {
            const trend = getTrend(stat.today);
            return (
              <Card key={stat.label} className="border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="py-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-bold">{stat.today}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trend.bg}`}>
                      <trend.icon className={`h-4 w-4 ${trend.color}`} />
                      <span className={`text-xs font-medium ${trend.color}`}>{t("today")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{stat.week}</span> {t("thisWeek")}
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{stat.month}</span> {t("thisMonth")}
                    </span>
                  </div>
                  {stat.yoy && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">YoY: </span>
                      <span className={`font-medium ${stat.yoy.color}`}>{stat.yoy.value}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Period Totals */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{t("users")} ({periodLabel})</p>
            <p className="text-2xl font-bold mt-1">{data.periodTotals.users}</p>
            {showYoY && data.lastYearPeriodTotals.users > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("vsLastYear", { count: data.lastYearPeriodTotals.users })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{t("groups")} ({periodLabel})</p>
            <p className="text-2xl font-bold mt-1">{data.periodTotals.groups}</p>
            {showYoY && data.lastYearPeriodTotals.groups > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("vsLastYear", { count: data.lastYearPeriodTotals.groups })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{t("items")} ({periodLabel})</p>
            <p className="text-2xl font-bold mt-1">{data.periodTotals.items}</p>
            {showYoY && data.lastYearPeriodTotals.items > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("vsLastYear", { count: data.lastYearPeriodTotals.items })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{t("claims")} ({periodLabel})</p>
            <p className="text-2xl font-bold mt-1">{data.periodTotals.claims}</p>
            {showYoY && data.lastYearPeriodTotals.claims > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("vsLastYear", { count: data.lastYearPeriodTotals.claims })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      {showYoY && data.lastYearGrowthData.length > 0 ? (
        <YoYComparisonChart
          currentData={data.growthData}
          lastYearData={data.lastYearGrowthData}
          title={t("growthComparison", { period: periodLabel })}
        />
      ) : (
        <MultiLineChart
          data={data.growthData}
          title={t("growthOverTime", { period: periodLabel })}
          granularity={data.granularity}
        />
      )}

      {/* Individual Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <GrowthChart
          data={data.growthData}
          title={t("userGrowth")}
          dataKey="users"
          color="#8b5cf6"
          showNew={true}
        />
        <GrowthChart
          data={data.growthData}
          title={t("groupGrowth")}
          dataKey="groups"
          color="#06b6d4"
          showNew={true}
        />
      </div>
    </div>
  );
}
