"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Eye,
  Users,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Target,
  Zap,
  Clock,
  Megaphone,
  Link2,
  Hash,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  TrendingUp,
  Mail,
  Bell,
  CheckCircle2,
  Send,
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
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface AnalyticsData {
  period: string;
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    uniqueUsers: number;
    avgEventsPerSession: number;
    comparison: {
      events: number;
      sessions: number;
      users: number;
    };
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
    // Additional fields for detailed view
    referrer: string | null;
    sessionId: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;
    value: number | null;
  }>;
  utmData: {
    sources: Array<{ name: string; value: number }>;
    mediums: Array<{ name: string; value: number }>;
    campaigns: Array<{ name: string; value: number }>;
  };
  referrers: Array<{ name: string; value: number }>;
  messaging?: {
    emails: {
      total: number;
      completed: number;
      failed: number;
      successRate: number;
      byStatus: Array<{ name: string; value: number }>;
      byType: Array<{ name: string; value: number }>;
      timeSeries: Array<{ date: string; count: number }>;
      comparison: { completed: number };
    };
    notifications: {
      total: number;
      read: number;
      readRate: number;
      byType: Array<{ name: string; value: number }>;
      comparison: { total: number };
    };
    announcements: {
      active: number;
      dismissals: number;
      comparison: { dismissals: number };
    };
  };
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

function ComparisonBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-accent" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value)}%
    </span>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const periods = [
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
  ];

  const fetchData = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Track user behavior and engagement</p>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                · Updated {formatTimeAgo(lastUpdated.toISOString())}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`rounded-lg ${autoRefresh ? "bg-accent hover:bg-accent/90" : ""}`}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Live" : "Auto"}
          </Button>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p.value)}
                className="rounded-md"
              >
                {p.label}
              </Button>
            ))}
          </div>
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  {data.summary.comparison && (
                    <ComparisonBadge value={data.summary.comparison.events} />
                  )}
                </div>
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Sessions</p>
                  {data.summary.comparison && (
                    <ComparisonBadge value={data.summary.comparison.sessions} />
                  )}
                </div>
                <p className="text-3xl font-bold">{data.summary.uniqueSessions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Unique Users</p>
                  {data.summary.comparison && (
                    <ComparisonBadge value={data.summary.comparison.users} />
                  )}
                </div>
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
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
              <Smartphone className="h-5 w-5 text-accent" />
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
              <Target className="h-5 w-5 text-accent" />
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
                              ? "bg-accent/20 text-accent hover:bg-accent/30"
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
                          <span className="text-accent font-medium">{journey.completed}</span> completed
                        </span>
                        <span className="text-muted-foreground">
                          <span className="text-red-500 font-medium">{journey.abandoned}</span> abandoned
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                        {journey.total > 0 && (
                          <>
                            <div
                              className="bg-accent transition-all"
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

      {/* UTM Campaign Tracking */}
      {(data.utmData?.sources?.length > 0 ||
        data.utmData?.mediums?.length > 0 ||
        data.utmData?.campaigns?.length > 0) && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* UTM Sources */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4 text-blue-500" />
                Traffic Sources
              </CardTitle>
              <CardDescription>utm_source breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.utmData.sources.length > 0 ? (
                  data.utmData.sources.map((source) => {
                    const maxValue = data.utmData.sources[0]?.value || 1;
                    const percentage = Math.round((source.value / maxValue) * 100);
                    return (
                      <div key={source.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate" title={source.name}>
                            {source.name}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {source.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No source data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* UTM Mediums */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4 w-4 text-emerald-500" />
                Traffic Mediums
              </CardTitle>
              <CardDescription>utm_medium breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.utmData.mediums.length > 0 ? (
                  data.utmData.mediums.map((medium) => {
                    const maxValue = data.utmData.mediums[0]?.value || 1;
                    const percentage = Math.round((medium.value / maxValue) * 100);
                    return (
                      <div key={medium.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate" title={medium.name}>
                            {medium.name}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {medium.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No medium data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* UTM Campaigns */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-orange-500" />
                Campaigns
              </CardTitle>
              <CardDescription>utm_campaign breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.utmData.campaigns.length > 0 ? (
                  data.utmData.campaigns.map((campaign) => {
                    const maxValue = data.utmData.campaigns[0]?.value || 1;
                    const percentage = Math.round((campaign.value / maxValue) * 100);
                    return (
                      <div key={campaign.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate" title={campaign.name}>
                            {campaign.name}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {campaign.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No campaign data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== MESSAGING SECTION ===== */}
      {data.messaging && (
        <>
          {/* Messaging Header */}
          <div className="pt-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Send className="h-5 w-5 text-pink-500" />
              Messaging Analytics
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Email delivery, notifications, and announcements
            </p>
          </div>

          {/* Messaging Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Emails Sent */}
            <Card className="border-0 bg-gradient-to-br from-pink-500/10 to-pink-500/5 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/20 rounded-xl">
                    <Mail className="h-5 w-5 text-pink-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Emails Sent</p>
                      <ComparisonBadge value={data.messaging.emails.comparison.completed} />
                    </div>
                    <p className="text-3xl font-bold">{data.messaging.emails.completed.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Success Rate */}
            <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Rate</p>
                    <p className="text-3xl font-bold">{data.messaging.emails.successRate}%</p>
                    {data.messaging.emails.failed > 0 && (
                      <p className="text-xs text-red-500">{data.messaging.emails.failed} failed</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Notifications</p>
                      <ComparisonBadge value={data.messaging.notifications.comparison.total} />
                    </div>
                    <p className="text-3xl font-bold">{data.messaging.notifications.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{data.messaging.notifications.readRate}% read</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="border-0 bg-gradient-to-br from-orange-500/10 to-orange-500/5 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <Megaphone className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Announcements</p>
                    <p className="text-3xl font-bold">{data.messaging.announcements.active}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{data.messaging.announcements.dismissals} dismissals</span>
                      <ComparisonBadge value={data.messaging.announcements.comparison.dismissals} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Email Volume Over Time */}
            <Card className="border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-pink-500" />
                  Email Volume
                </CardTitle>
                <CardDescription>Emails sent over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {data.messaging.emails.timeSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={data.messaging.emails.timeSeries}>
                        <defs>
                          <linearGradient id="emailGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
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
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#ec4899"
                          strokeWidth={2}
                          fill="url(#emailGradient)"
                          name="Emails"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No email data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Types Distribution */}
            <Card className="border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-pink-500" />
                  Email Types
                </CardTitle>
                <CardDescription>Distribution by email type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {data.messaging.emails.byType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart
                        data={data.messaging.emails.byType.slice(0, 8)}
                        layout="vertical"
                        margin={{ left: 0, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={100}
                          tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + "..." : value}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} name="Emails" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No email type data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notification Types */}
          {data.messaging.notifications.byType.length > 0 && (
            <Card className="border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Notification Types
                </CardTitle>
                <CardDescription>Distribution by notification type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.messaging.notifications.byType.map((notif, index) => {
                    const maxValue = data.messaging!.notifications.byType[0]?.value || 1;
                    const percentage = Math.round((notif.value / maxValue) * 100);
                    const colors = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
                    const color = colors[index % colors.length];

                    return (
                      <div key={notif.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate" title={notif.name}>
                            {notif.name.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {notif.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Referrers Section */}
      {data.referrers && data.referrers.length > 0 && (
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-500" />
              Top Referrers
            </CardTitle>
            <CardDescription>Where your traffic is coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {data.referrers.map((referrer, index) => {
                const maxValue = data.referrers[0]?.value || 1;
                const percentage = Math.round((referrer.value / maxValue) * 100);
                return (
                  <div key={referrer.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4">
                          {index + 1}.
                        </span>
                        <span className="font-medium truncate" title={referrer.name}>
                          {referrer.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        {referrer.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-6">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events Stream */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Recent Events
          </CardTitle>
          <CardDescription>Live event stream - click an event for details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {data.recentEvents.length > 0 ? (
              data.recentEvents.map((event) => {
                const isExpanded = expandedEventId === event.id;
                const hasUtm = event.utmSource || event.utmMedium || event.utmCampaign;
                const cleanPage = event.page.split("?")[0]; // Remove query params for display
                const queryParams = event.page.includes("?") ? event.page.split("?")[1] : null;

                return (
                  <div
                    key={event.id}
                    className="rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden"
                  >
                    {/* Main row - clickable */}
                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(event.category) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs font-mono">
                            {event.category}
                          </Badge>
                          <span className="text-sm font-medium">{event.action}</span>
                          {event.label && (
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {event.label}
                            </span>
                          )}
                          {hasUtm && (
                            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                              UTM
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono truncate max-w-[300px]">{cleanPage}</span>
                          {event.deviceType && (
                            <>
                              <span>·</span>
                              <span className="capitalize">{event.deviceType}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(event.createdAt)}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                          {/* Full URL */}
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Full URL:</span>
                            <div className="font-mono bg-background/50 p-2 rounded mt-1 break-all">
                              {event.page}
                            </div>
                          </div>

                          {/* Query Parameters breakdown */}
                          {queryParams && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Query Parameters:</span>
                              <div className="bg-background/50 p-2 rounded mt-1 space-y-1">
                                {queryParams.split("&").map((param, idx) => {
                                  const [key, value] = param.split("=");
                                  const decodedValue = decodeURIComponent(value || "");
                                  // Truncate very long values (like fbclid)
                                  const displayValue =
                                    decodedValue.length > 50
                                      ? decodedValue.substring(0, 50) + "..."
                                      : decodedValue;
                                  return (
                                    <div key={idx} className="flex gap-2">
                                      <span className="font-medium text-purple-600">{key}:</span>
                                      <span className="font-mono text-muted-foreground truncate">
                                        {displayValue}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Referrer */}
                          {event.referrer && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Referrer:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono">{event.referrer}</span>
                              </div>
                            </div>
                          )}

                          {/* UTM Parameters */}
                          {hasUtm && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">UTM Parameters:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {event.utmSource && (
                                  <Badge variant="outline" className="text-xs">
                                    <span className="text-muted-foreground mr-1">source:</span>
                                    {event.utmSource}
                                  </Badge>
                                )}
                                {event.utmMedium && (
                                  <Badge variant="outline" className="text-xs">
                                    <span className="text-muted-foreground mr-1">medium:</span>
                                    {event.utmMedium}
                                  </Badge>
                                )}
                                {event.utmCampaign && (
                                  <Badge variant="outline" className="text-xs">
                                    <span className="text-muted-foreground mr-1">campaign:</span>
                                    {event.utmCampaign}
                                  </Badge>
                                )}
                                {event.utmContent && (
                                  <Badge variant="outline" className="text-xs">
                                    <span className="text-muted-foreground mr-1">content:</span>
                                    {event.utmContent}
                                  </Badge>
                                )}
                                {event.utmTerm && (
                                  <Badge variant="outline" className="text-xs">
                                    <span className="text-muted-foreground mr-1">term:</span>
                                    {event.utmTerm}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Session & Event Info */}
                          <div>
                            <span className="text-muted-foreground">Session ID:</span>
                            <div className="font-mono mt-1 truncate">{event.sessionId}</div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Event ID:</span>
                            <div className="font-mono mt-1 truncate">{event.id}</div>
                          </div>

                          {event.value !== null && (
                            <div>
                              <span className="text-muted-foreground">Value:</span>
                              <div className="font-medium mt-1">{event.value}</div>
                            </div>
                          )}

                          <div>
                            <span className="text-muted-foreground">Timestamp:</span>
                            <div className="mt-1">
                              {new Date(event.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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
