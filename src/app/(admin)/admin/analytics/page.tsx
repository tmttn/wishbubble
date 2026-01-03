"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Eye,
  Users,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Activity,
  Target,
  Zap,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface AnalyticsData {
  period: string;
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    uniqueUsers: number;
    avgEventsPerSession: number;
  };
  categoryData: Array<{ name: string; value: number }>;
  deviceData: Array<{ name: string; value: number }>;
  topPages: Array<{ page: string; views: number }>;
  eventsTimeSeries: Array<{ date: string; count: number }>;
  journeyFunnels: Array<{
    id: string;
    name: string;
    total: number;
    inProgress: number;
    completed: number;
    abandoned: number;
    completionRate: number;
  }>;
  recentEvents: Array<{
    id: string;
    category: string;
    action: string;
    label: string | null;
    page: string;
    deviceType: string | null;
    createdAt: string;
  }>;
}

const COLORS = {
  navigation: "#8b5cf6",
  feature: "#06b6d4",
  conversion: "#10b981",
  engagement: "#f59e0b",
  error: "#ef4444",
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const DEVICE_COLORS = ["#8b5cf6", "#06b6d4", "#10b981"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  const periods = [
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
  ];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track user behavior and engagement</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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

  if (!data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">No data available yet</p>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    return COLORS[category as keyof typeof COLORS] || "#6b7280";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Track user behavior and engagement</p>
        </div>
        <div className="flex gap-2">
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
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold">{data.summary.totalEvents.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Eye className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-3xl font-bold">{data.summary.uniqueSessions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-3xl font-bold">{data.summary.uniqueUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Events/Session</p>
                <p className="text-3xl font-bold">{data.summary.avgEventsPerSession}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Over Time Chart */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Events Over Time
          </CardTitle>
          <CardDescription>Track event volume trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {data.eventsTimeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.eventsTimeSeries}>
                  <defs>
                    <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#eventGradient)"
                    name="Events"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No event data yet. Events will appear as users interact with the site.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-500" />
              Event Categories
            </CardTitle>
            <CardDescription>Breakdown by event type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No category data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-500" />
              Device Types
            </CardTitle>
            <CardDescription>User device breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceData.length > 0 ? (
                data.deviceData.map((device, index) => {
                  const Icon = DEVICE_ICONS[device.name as keyof typeof DEVICE_ICONS] || Monitor;
                  const total = data.deviceData.reduce((sum, d) => sum + d.value, 0);
                  const percentage = total > 0 ? Math.round((device.value / total) * 100) : 0;

                  return (
                    <div key={device.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: `${DEVICE_COLORS[index]}20` }}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: DEVICE_COLORS[index] }}
                            />
                          </div>
                          <span className="font-medium capitalize">{device.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{device.value}</span>
                          <Badge variant="secondary" className="font-mono">
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: DEVICE_COLORS[index],
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No device data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages & Journey Funnels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-amber-500" />
              Top Pages
            </CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPages.length > 0 ? (
                data.topPages.map((page, index) => {
                  const maxViews = data.topPages[0]?.views || 1;
                  const percentage = Math.round((page.views / maxViews) * 100);

                  return (
                    <div key={page.page} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-4">
                            {index + 1}.
                          </span>
                          <span className="font-mono text-sm truncate" title={page.page}>
                            {page.page}
                          </span>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {page.views.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-6">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No page view data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Journey Funnels */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              User Journeys
            </CardTitle>
            <CardDescription>Conversion funnel progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.journeyFunnels.filter((j) => j.total > 0).length > 0 ? (
                data.journeyFunnels
                  .filter((j) => j.total > 0)
                  .map((journey) => (
                    <div key={journey.id} className="p-3 rounded-xl bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{journey.name}</span>
                        <Badge
                          variant={journey.completionRate >= 50 ? "default" : "secondary"}
                          className={
                            journey.completionRate >= 50
                              ? "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                              : ""
                          }
                        >
                          {journey.completionRate}% complete
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <span className="text-amber-500 font-medium">{journey.inProgress}</span> in progress
                        </span>
                        <span className="text-muted-foreground">
                          <span className="text-green-500 font-medium">{journey.completed}</span> completed
                        </span>
                        <span className="text-muted-foreground">
                          <span className="text-red-500 font-medium">{journey.abandoned}</span> abandoned
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                        {journey.total > 0 && (
                          <>
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${(journey.completed / journey.total) * 100}%` }}
                            />
                            <div
                              className="bg-amber-500 transition-all"
                              style={{ width: `${(journey.inProgress / journey.total) * 100}%` }}
                            />
                            <div
                              className="bg-red-500/50 transition-all"
                              style={{ width: `${(journey.abandoned / journey.total) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No journey data yet. Journeys will appear as users progress through funnels.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Stream */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Recent Events
          </CardTitle>
          <CardDescription>Live event stream</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data.recentEvents.length > 0 ? (
              data.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(event.category) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {event.category}
                      </Badge>
                      <span className="text-sm font-medium">{event.action}</span>
                      {event.label && (
                        <span className="text-sm text-muted-foreground truncate">
                          {event.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{event.page}</span>
                      {event.deviceType && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{event.deviceType}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTimeAgo(event.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No events recorded yet. Events will appear here in real-time.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
