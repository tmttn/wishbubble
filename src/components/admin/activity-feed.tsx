"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  LogIn,
  Gift,
  ShoppingCart,
  Users,
  CreditCard,
  Activity,
  LogOut,
  Mail,
  UserMinus,
  Send,
  ArrowRightLeft,
  ListPlus,
  Pencil,
  Trash2,
  Shuffle,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  UserCircle,
  Zap,
  Crown,
} from "lucide-react";
import { ActivityType } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

export interface FormattedActivity {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: Date;
}

interface ActivityFeedProps {
  activities: FormattedActivity[];
  labels: {
    title: string;
    viewAll: string;
    noActivity: string;
  };
}

const activityIcons: Record<ActivityType, React.ElementType> = {
  // Auth events
  USER_REGISTERED: UserPlus,
  USER_LOGIN: LogIn,
  USER_LOGOUT: LogOut,
  EMAIL_VERIFIED: Mail,
  EMAIL_CHANGE_REQUESTED: Mail,
  EMAIL_CHANGED: Mail,
  PASSWORD_RESET_REQUESTED: Mail,
  PASSWORD_RESET_COMPLETED: CheckCircle,
  VERIFICATION_EMAIL_RESENT: Send,
  // Member events
  MEMBER_JOINED: Users,
  MEMBER_LEFT: UserMinus,
  MEMBER_REMOVED: UserMinus,
  MEMBER_INVITED: Send,
  MEMBER_ROLE_CHANGED: ArrowRightLeft,
  OWNERSHIP_TRANSFERRED: ArrowRightLeft,
  // Wishlist events
  WISHLIST_CREATED: ListPlus,
  WISHLIST_ATTACHED: ListPlus,
  WISHLIST_DETACHED: ListPlus,
  ITEM_ADDED: Gift,
  ITEM_UPDATED: Pencil,
  ITEM_DELETED: Trash2,
  // Claim events
  ITEM_CLAIMED: ShoppingCart,
  ITEM_UNCLAIMED: ShoppingCart,
  ITEM_PURCHASED: CheckCircle,
  // Group events
  GROUP_CREATED: Users,
  GROUP_UPDATED: Pencil,
  GROUP_DELETED: Trash2,
  GROUP_ARCHIVED: Trash2,
  SECRET_SANTA_DRAWN: Shuffle,
  SECRET_SANTA_RESET: RotateCcw,
  // System events
  EVENT_APPROACHING: Clock,
  EVENT_COMPLETED: CheckCircle,
  RATE_LIMIT_EXCEEDED: AlertTriangle,
  // Subscription events
  SUBSCRIPTION_CREATED: CreditCard,
  SUBSCRIPTION_UPGRADED: ArrowUpCircle,
  SUBSCRIPTION_DOWNGRADED: ArrowDownCircle,
  SUBSCRIPTION_CANCELED: XCircle,
  SUBSCRIPTION_RENEWED: CreditCard,
  PAYMENT_SUCCEEDED: CheckCircle,
  PAYMENT_FAILED: XCircle,
  TRIAL_STARTED: Clock,
  TRIAL_ENDED: Clock,
  COUPON_APPLIED: Gift,
  // Admin moderation events
  USER_SUSPENDED: UserMinus,
  USER_UNSUSPENDED: UserPlus,
  USER_DELETED_BY_ADMIN: Trash2,
  ADMIN_IMPERSONATION: UserCircle,
  ADMIN_TIER_CHANGE: Crown,
  // Simulation events
  SIMULATION_TRIGGERED: Zap,
};

function getActivityIcon(type: ActivityType) {
  return activityIcons[type] || Activity;
}

export function ActivityFeed({ activities, labels }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{labels.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{labels.noActivity}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{labels.title}</CardTitle>
        <Link
          href="/admin/activity"
          className="text-sm text-primary hover:underline"
        >
          {labels.viewAll}
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 p-2 rounded-lg",
                "hover:bg-secondary/30 transition-colors"
              )}
            >
              <div className="p-2 rounded-full bg-secondary/50">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
