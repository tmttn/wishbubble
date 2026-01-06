"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GrowthData {
  date: string;
  dateKey?: string;
  users: number;
  groups: number;
  items: number;
  claims: number;
  newUsers?: number;
  newGroups?: number;
  newItems?: number;
  newClaims?: number;
}

interface GrowthChartProps {
  data: GrowthData[];
  title: string;
  dataKey: keyof Omit<GrowthData, "date" | "dateKey">;
  color?: string;
  showNew?: boolean;
}

export function GrowthChart({
  data,
  title,
  dataKey,
  color = "#8b5cf6",
  showNew = false,
}: GrowthChartProps) {
  const newDataKey = `new${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}` as keyof GrowthData;

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cumulative" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cumulative">Total</TabsTrigger>
            {showNew && <TabsTrigger value="new">New per Period</TabsTrigger>}
          </TabsList>
          <TabsContent value="cumulative">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
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
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#gradient-${dataKey})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          {showNew && (
            <TabsContent value="new">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
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
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey={newDataKey} fill={color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface MultiLineChartProps {
  data: GrowthData[];
  title: string;
  granularity?: string;
}

export function MultiLineChart({ data, title, granularity }: MultiLineChartProps) {
  // Configuration for each metric
  const metrics = [
    { key: "users" as const, name: "Users", color: "#8b5cf6" },
    { key: "groups" as const, name: "Groups", color: "#06b6d4" },
    { key: "items" as const, name: "Items", color: "#f59e0b" },
    { key: "claims" as const, name: "Claims", color: "#10b981" },
  ];

  // Show fewer ticks for longer time periods
  const tickInterval = data.length > 60 ? Math.floor(data.length / 12) : data.length > 30 ? 3 : "preserveStartEnd";

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {granularity && (
            <span className="text-xs text-muted-foreground capitalize">
              Grouped by {granularity}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => {
            // Calculate min/max for this specific metric
            const values = data.map((d) => d[metric.key]);
            const maxValue = Math.max(...values);
            
            return (
              <div key={metric.key} className="h-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: metric.color }}
                  />
                  <span className="text-sm font-medium">{metric.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Max: {maxValue.toLocaleString()}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9 }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      interval={tickInterval}
                      angle={data.length > 14 ? -45 : 0}
                      textAnchor={data.length > 14 ? "end" : "middle"}
                      height={data.length > 14 ? 40 : 20}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tickFormatter={(value) => 
                        value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value) => [(value as number).toLocaleString(), metric.name]}
                    />
                    <Area
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2}
                      fill={`url(#gradient-${metric.key})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface YoYComparisonChartProps {
  currentData: GrowthData[];
  lastYearData: GrowthData[];
  title: string;
}

export function YoYComparisonChart({ currentData, lastYearData, title }: YoYComparisonChartProps) {
  // Align data by index for comparison (same position in period)
  const maxLength = Math.max(currentData.length, lastYearData.length);
  const comparisonData = [];

  for (let i = 0; i < maxLength; i++) {
    const current = currentData[i];
    const lastYear = lastYearData[i];

    comparisonData.push({
      date: current?.date || lastYear?.date || "",
      usersThisYear: current?.users || null,
      usersLastYear: lastYear?.users || null,
      groupsThisYear: current?.groups || null,
      groupsLastYear: lastYear?.groups || null,
      newUsersThisYear: current?.newUsers || 0,
      newUsersLastYear: lastYear?.newUsers || 0,
    });
  }

  const tickInterval = comparisonData.length > 60 ? Math.floor(comparisonData.length / 12) : comparisonData.length > 30 ? 3 : "preserveStartEnd";

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="newUsers">New Users</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="usersThisYear"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="This Year"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="usersLastYear"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Last Year"
                    opacity={0.5}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="groups">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="groupsThisYear"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    name="This Year"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="groupsLastYear"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Last Year"
                    opacity={0.5}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="newUsers">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
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
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="newUsersThisYear" fill="#8b5cf6" name="This Year" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="newUsersLastYear" fill="#8b5cf6" opacity={0.3} name="Last Year" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
