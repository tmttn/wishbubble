import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Mail,
  MessageSquare,
  Bell,
  FileText,
  Settings,
  Zap,
} from "lucide-react";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface QuickActionsBarProps {
  labels: {
    title: string;
    addUser: string;
    sendEmail: string;
    viewMessages: string;
    sendNotification: string;
    announcements: string;
    settings: string;
  };
}

export function QuickActionsBar({ labels }: QuickActionsBarProps) {
  const actions: QuickAction[] = [
    { label: labels.addUser, href: "/admin/users/new", icon: UserPlus },
    { label: labels.sendEmail, href: "/admin/email-queue", icon: Mail },
    { label: labels.viewMessages, href: "/admin/contact", icon: MessageSquare },
    {
      label: labels.sendNotification,
      href: "/admin/notifications/new",
      icon: Bell,
    },
    { label: labels.announcements, href: "/admin/announcements", icon: FileText },
    { label: labels.settings, href: "/admin/settings", icon: Settings },
  ];

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardContent className="py-3 px-4">
        {/* Desktop layout */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">{labels.title}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.href}
                variant="secondary"
                size="sm"
                asChild
                className="gap-2 h-8"
              >
                <Link href={action.href}>
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        {/* Mobile layout - horizontal scroll */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">{labels.title}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {actions.map((action) => (
              <Button
                key={action.href}
                variant="secondary"
                size="sm"
                asChild
                className="gap-2 h-10 min-w-fit shrink-0"
              >
                <Link href={action.href}>
                  <action.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
