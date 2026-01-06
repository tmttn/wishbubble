import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  HealthLevel,
  getHealthLevelColor,
  getHealthLevelBgColor,
} from "@/lib/admin/health-status";
import {
  LucideIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

interface HealthIndicatorCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  level: HealthLevel;
  icon: LucideIcon;
  href?: string;
}

const statusIcons = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertCircle,
} as const;

export function HealthIndicatorCard({
  title,
  value,
  subtitle,
  level,
  icon: Icon,
  href,
}: HealthIndicatorCardProps) {
  const StatusIcon = statusIcons[level];

  const content = (
    <Card
      className={cn(
        "border-0 backdrop-blur-sm transition-colors",
        getHealthLevelBgColor(level),
        href && "hover:bg-opacity-20 cursor-pointer"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-4 w-4", getHealthLevelColor(level))} />
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-xs mt-1 h-4", subtitle ? getHealthLevelColor(level) : "invisible")}>
          {subtitle || "placeholder"}
        </p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
