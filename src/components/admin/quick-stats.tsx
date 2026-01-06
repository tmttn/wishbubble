import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Users2,
  Gift,
  ShoppingCart,
} from "lucide-react";
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
  const TrendIcon =
    trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0
      ? "text-green-500"
      : trend < 0
        ? "text-red-500"
        : "text-muted-foreground";

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
        <p
          className={cn(
            "text-sm flex items-center gap-1 justify-end",
            trendColor
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {trend > 0 ? "+" : ""}
          {trend}%
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
