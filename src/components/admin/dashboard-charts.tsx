"use client";

import { useEffect, useState } from "react";
import { GrowthChart, MultiLineChart } from "./growth-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GrowthData {
  date: string;
  users: number;
  groups: number;
  items: number;
  claims: number;
}

interface StatsResponse {
  growthData: GrowthData[];
  today: { users: number; groups: number; claims: number };
  week: { users: number; groups: number; claims: number };
}

export function DashboardCharts() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
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
    if (value > 0) return { icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" };
    if (value < 0) return { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" };
    return { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" };
  };

  const todayStats = [
    { label: "New Users Today", value: data.today.users, weekValue: data.week.users },
    { label: "New Groups Today", value: data.today.groups, weekValue: data.week.groups },
    { label: "Claims Today", value: data.today.claims, weekValue: data.week.claims },
  ];

  return (
    <div className="space-y-6">
      {/* Today's Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Activity</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {todayStats.map((stat) => {
            const trend = getTrend(stat.value);
            return (
              <Card key={stat.label} className="border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="py-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trend.bg}`}>
                      <trend.icon className={`h-4 w-4 ${trend.color}`} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.weekValue} this week
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Growth Chart */}
      <MultiLineChart data={data.growthData} title="Growth Over Time (Last 30 Days)" />

      {/* Individual Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <GrowthChart
          data={data.growthData}
          title="User Growth"
          dataKey="users"
          color="#8b5cf6"
        />
        <GrowthChart
          data={data.growthData}
          title="Group Growth"
          dataKey="groups"
          color="#06b6d4"
        />
      </div>
    </div>
  );
}
