import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageSquare,
  CreditCard,
  Clock,
  LucideIcon,
} from "lucide-react";

export interface Alert {
  id: string;
  type: "email" | "contact" | "payment" | "trial";
  severity: "warning" | "critical";
  title: string;
  description: string;
  href: string;
  iconType: "mail" | "message" | "credit" | "clock";
}

interface AttentionAlertsProps {
  alerts: Alert[];
  title: string;
  allClearMessage: string;
}

const iconMap: Record<Alert["iconType"], LucideIcon> = {
  mail: Mail,
  message: MessageSquare,
  credit: CreditCard,
  clock: Clock,
};

export function AttentionAlerts({
  alerts,
  title,
  allClearMessage,
}: AttentionAlertsProps) {
  const hasAlerts = alerts.length > 0;

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        {hasAlerts ? (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-accent" />
        )}
        <CardTitle className="text-lg">{title}</CardTitle>
        {hasAlerts && (
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAlerts && (
          <p className="text-sm text-muted-foreground">
            {allClearMessage}
          </p>
        )}
        {alerts.map((alert) => {
          const Icon = iconMap[alert.iconType];
          return (
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
              <Icon
                className={cn(
                  "h-5 w-5 mt-0.5 shrink-0",
                  alert.severity === "critical"
                    ? "text-red-500"
                    : "text-yellow-500"
                )}
              />
              <div className="min-w-0">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {alert.description}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
