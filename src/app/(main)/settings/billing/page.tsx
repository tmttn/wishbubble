"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Crown,
  CreditCard,
  ExternalLink,
  Gift,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfirmationDialog,
  useConfirmation,
} from "@/components/ui/confirmation-dialog";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";

interface SubscriptionData {
  subscription: {
    id: string;
    tier: "BASIC" | "PLUS" | "COMPLETE";
    interval: "MONTHLY" | "YEARLY";
    status: string;
    trialEndsAt: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
  } | null;
  usage: {
    tier: "BASIC" | "PLUS" | "COMPLETE";
    limits: {
      maxOwnedGroups: number;
      maxMembersPerGroup: number;
      maxWishlists: number;
      maxItemsPerWishlist: number;
      canUseSecretSanta: boolean;
    };
    usage: {
      ownedGroups: number;
      wishlists: number;
      totalItems: number;
    };
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function UsageBar({
  current,
  limit,
  label,
}: {
  current: number;
  limit: number;
  label: string;
}) {
  if (limit === -1) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="text-muted-foreground">{current} (unlimited)</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={cn(isNearLimit && "text-yellow-600 dark:text-yellow-400")}>
          {current} / {limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn("h-2", isNearLimit && "[&>div]:bg-yellow-500")}
      />
    </div>
  );
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const tConfirmations = useTypedTranslations("confirmations");
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const { confirm, dialogProps } = useConfirmation();

  const success = searchParams.get("success") === "true";

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/billing/subscription");
      const result = await response.json();
      setData(result);
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "BillingPage", action: "fetchSubscription" } });
    } finally {
      setIsLoading(false);
    }
  };

  const openPortal = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const result = await response.json();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "BillingPage", action: "openPortal" } });
    } finally {
      setIsPortalLoading(false);
    }
  };

  const cancelSubscription = () => {
    const doCancel = async () => {
      setIsCanceling(true);
      try {
        await fetch("/api/billing/subscription", { method: "DELETE" });
        fetchSubscription();
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "BillingPage", action: "cancelSubscription" } });
      } finally {
        setIsCanceling(false);
      }
    };

    confirm({
      title: tConfirmations("cancelSubscriptionTitle"),
      description: tConfirmations("cancelSubscription"),
      confirmText: tConfirmations("confirm"),
      cancelText: tConfirmations("cancel"),
      variant: "destructive",
      onConfirm: doCancel,
    });
  };

  const reactivateSubscription = async () => {
    setIsReactivating(true);
    try {
      await fetch("/api/billing/subscription", { method: "PATCH" });
      fetchSubscription();
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "BillingPage", action: "reactivateSubscription" } });
    } finally {
      setIsReactivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const subscription = data?.subscription;
  const usage = data?.usage;
  const tier = usage?.tier || "BASIC";
  const isPaid = tier === "PLUS" || tier === "COMPLETE";
  const isTrialing = subscription?.status === "TRIALING";
  const isCanceled = subscription?.cancelAtPeriodEnd;

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>

      {success && (
        <Alert className="mb-6 border-accent bg-accent/10">
          <CheckCircle className="h-4 w-4 text-accent" />
          <AlertDescription className="text-accent-foreground">
            Welcome to Plus! Your subscription is now active.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isPaid ? "bg-primary/10" : "bg-muted"
                )}>
                  {isPaid ? (
                    <Crown className="h-5 w-5 text-primary" />
                  ) : (
                    <Gift className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {tier} Plan
                    {isTrialing && (
                      <Badge variant="secondary">Trial</Badge>
                    )}
                    {isCanceled && (
                      <Badge variant="destructive">Canceling</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isPaid
                      ? `Billed ${subscription?.interval === "YEARLY" ? "yearly" : "monthly"}`
                      : "Basic tier - Free forever"}
                  </CardDescription>
                </div>
              </div>
              {!isPaid && (
                <Button asChild>
                  <Link href="/pricing">
                    Upgrade
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          {subscription && (
            <CardContent className="pt-0">
              <div className="grid gap-4 text-sm">
                {isTrialing && subscription.trialEndsAt && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>
                      Your trial ends on {formatDate(subscription.trialEndsAt)}
                    </span>
                  </div>
                )}

                {isCanceled && (
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span>
                      Access until {formatDate(subscription.currentPeriodEnd)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reactivateSubscription}
                      disabled={isReactivating}
                    >
                      {isReactivating ? "Reactivating..." : "Reactivate"}
                    </Button>
                  </div>
                )}

                {!isCanceled && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next billing date</span>
                    <span>{formatDate(subscription.currentPeriodEnd)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Usage */}
        {usage && (
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Your current resource usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageBar
                current={usage.usage.ownedGroups}
                limit={usage.limits.maxOwnedGroups}
                label="Groups owned"
              />
              <UsageBar
                current={usage.usage.wishlists}
                limit={usage.limits.maxWishlists}
                label="Wishlists"
              />
              <UsageBar
                current={usage.usage.totalItems}
                limit={usage.limits.maxItemsPerWishlist === -1 ? -1 : usage.limits.maxItemsPerWishlist * usage.limits.maxWishlists}
                label="Total items"
              />

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span>Secret Santa</span>
                  {usage.limits.canUseSecretSanta ? (
                    <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline">Plus feature</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manage Subscription */}
        {isPaid && subscription && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>
                Update payment method, view invoices, or cancel
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={openPortal}
                disabled={isPortalLoading}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isPortalLoading ? "Loading..." : "Manage in Stripe"}
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>

              {!isCanceled && (
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={cancelSubscription}
                  disabled={isCanceling}
                >
                  {isCanceling ? "Canceling..." : "Cancel subscription"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmationDialog {...dialogProps} />
    </div>
  );
}
