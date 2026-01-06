import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Mail,
  MessageSquare,
  CreditCard,
  Clock,
} from "lucide-react";
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
      description: t("alerts.failedEmails.description", {
        count: metrics.emailQueue.failedCount,
      }),
      href: "/admin/email-queue?status=FAILED",
      icon: Mail,
    });
  }

  // Unanswered contacts
  if (metrics.contactInbox.unansweredCount > 0) {
    alerts.push({
      id: "unanswered-contacts",
      type: "contact",
      severity:
        metrics.contactInbox.level === "critical" ? "critical" : "warning",
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
      description: t("alerts.pastDuePayments.description", {
        count: metrics.payments.pastDueCount,
      }),
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
      description: t("alerts.expiringTrials.description", {
        count: metrics.trials.expiringIn24hCount,
      }),
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
            <alert.icon
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
        ))}
      </CardContent>
    </Card>
  );
}
