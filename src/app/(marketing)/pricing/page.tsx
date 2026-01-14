"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Sparkles, Gift, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const t = useTranslations("pricingPage");
  const [isYearly, setIsYearly] = useState(true);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const canceled = searchParams.get("canceled") === "true";

  const PLANS = {
    BASIC: {
      name: t("basic.name"),
      description: t("basic.description"),
      icon: Gift,
      pricing: { monthly: 0, yearly: 0 },
      limits: {
        groups: 2,
        membersPerGroup: 8,
        wishlists: 3,
        itemsPerWishlist: 4,
      },
      features: [
        { name: t("basic.features.groups"), included: true },
        { name: t("basic.features.members"), included: true },
        { name: t("basic.features.wishlists"), included: true },
        { name: t("basic.features.joinGroups"), included: true },
        { name: t("basic.features.notifications"), included: true },
        { name: t("basic.features.secretSanta"), included: false },
      ],
    },
    PLUS: {
      name: t("plus.name"),
      description: t("plus.description"),
      icon: Crown,
      pricing: { monthly: 499, yearly: 3999 },
      limits: {
        groups: 10,
        membersPerGroup: 25,
        wishlists: -1,
        itemsPerWishlist: -1,
      },
      features: [
        { name: t("plus.features.groups"), included: true },
        { name: t("plus.features.members"), included: true },
        { name: t("plus.features.wishlists"), included: true },
        { name: t("plus.features.joinGroups"), included: true },
        { name: t("plus.features.notifications"), included: true },
        { name: t("plus.features.secretSanta"), included: true },
        { name: t("plus.features.earlyAccess"), included: true },
      ],
      popular: true,
    },
    COMPLETE: {
      name: t("complete.name"),
      description: t("complete.description"),
      icon: Sparkles,
      pricing: { monthly: 999, yearly: 7999 },
      limits: {
        groups: -1,
        membersPerGroup: -1,
        wishlists: -1,
        itemsPerWishlist: -1,
      },
      features: [
        { name: t("complete.features.unlimitedGroups"), included: true },
        { name: t("complete.features.unlimitedMembers"), included: true },
        { name: t("complete.features.unlimitedWishlists"), included: true },
        { name: t("complete.features.secretSanta"), included: true },
        { name: t("complete.features.publicWishlists"), included: true },
        { name: t("complete.features.priceDropAlerts"), included: true },
        { name: t("complete.features.giftHistory"), included: true },
        { name: t("complete.features.earlyAccess"), included: true },
      ],
    },
  };

  const handleSubscribe = async (tier: "PLUS" | "COMPLETE") => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    setIsLoading(tier);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          interval: isYearly ? "YEARLY" : "MONTHLY",
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "Already subscribed") {
        // User already has an active subscription, redirect to billing
        router.push("/settings/billing");
      } else {
        Sentry.captureMessage("No checkout URL returned", { level: "error", extra: { data } });
        alert(`Checkout failed: ${data.details || data.error || "Unknown error"}`);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "PricingPage", action: "checkout" } });
    } finally {
      setIsLoading(null);
    }
  };

  const yearlySavings = Math.round(
    ((PLANS.PLUS.pricing.monthly * 12 - PLANS.PLUS.pricing.yearly) /
      (PLANS.PLUS.pricing.monthly * 12)) *
      100
  );

  return (
    <div className="container max-w-6xl py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="h-3 w-3 mr-1" />
          {t("header.badge")}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t("header.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("header.subtitle")}
        </p>

        {canceled && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg max-w-md mx-auto">
            {t("canceled")}
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label htmlFor="billing-toggle" className={cn(!isYearly && "text-foreground", isYearly && "text-muted-foreground")}>
          {t("billing.monthly")}
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={cn(isYearly && "text-foreground", !isYearly && "text-muted-foreground")}>
          {t("billing.yearly")}
          <Badge variant="secondary" className="ml-2 text-xs">
            {t("billing.save", { percent: yearlySavings })}
          </Badge>
        </Label>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {/* Basic Plan */}
        <Card className="relative flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Gift className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-2xl">{PLANS.BASIC.name}</CardTitle>
            <CardDescription>{PLANS.BASIC.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-6">
              <span className="text-4xl font-bold">€ 0</span>
              <span className="text-muted-foreground">/{t("billing.perMonth")}</span>
            </div>
            <ul className="space-y-3">
              {PLANS.BASIC.features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-accent flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={cn(!feature.included && "text-muted-foreground")}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button variant="outline" className="w-full" asChild>
              <a href={session ? "/dashboard" : "/register"}>
                {session ? t("basic.ctaDashboard") : t("basic.cta")}
              </a>
            </Button>
          </CardFooter>
        </Card>

        {/* Plus Plan */}
        <Card className="relative border-primary shadow-lg flex flex-col">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              {t("plus.badge")}
            </Badge>
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{PLANS.PLUS.name}</CardTitle>
            <CardDescription>{PLANS.PLUS.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {formatPrice(isYearly ? Math.round(PLANS.PLUS.pricing.yearly / 12) : PLANS.PLUS.pricing.monthly)}
              </span>
              <span className="text-muted-foreground">/{t("billing.perMonth")}</span>
              {isYearly && (
                <div className="text-sm text-muted-foreground">
                  {t("billing.billedAs", { price: formatPrice(PLANS.PLUS.pricing.yearly) })}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t("plus.includesBasic")}</p>
            <ul className="space-y-3">
              {PLANS.PLUS.features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button
              className="w-full"
              onClick={() => handleSubscribe("PLUS")}
              disabled={isLoading !== null}
            >
              {isLoading === "PLUS" ? (
                t("loading")
              ) : (
                <>
                  {t("plus.cta")}
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Complete Plan */}
        <Card className="relative flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-2xl">{PLANS.COMPLETE.name}</CardTitle>
            <CardDescription>{PLANS.COMPLETE.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {formatPrice(isYearly ? Math.round(PLANS.COMPLETE.pricing.yearly / 12) : PLANS.COMPLETE.pricing.monthly)}
              </span>
              <span className="text-muted-foreground">/{t("billing.perMonth")}</span>
              {isYearly && (
                <div className="text-sm text-muted-foreground">
                  {t("billing.billedAs", { price: formatPrice(PLANS.COMPLETE.pricing.yearly) })}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t("complete.includesPlus")}</p>
            <ul className="space-y-3">
              {PLANS.COMPLETE.features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSubscribe("COMPLETE")}
              disabled={isLoading !== null}
            >
              {isLoading === "COMPLETE" ? (
                t("loading")
              ) : (
                <>
                  {t("complete.cta")}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">{t("faq.title")}</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">{t("faq.trial.question")}</h3>
            <p className="text-muted-foreground">
              {t("faq.trial.answer")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t("faq.limits.question")}</h3>
            <p className="text-muted-foreground">
              {t("faq.limits.answer")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t("faq.cancel.question")}</h3>
            <p className="text-muted-foreground">
              {t("faq.cancel.answer")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t("faq.payment.question")}</h3>
            <p className="text-muted-foreground">
              {t("faq.payment.answer")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t("faq.joinGroup.question")}</h3>
            <p className="text-muted-foreground">
              {t("faq.joinGroup.answer")}
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{t("footer")}</span>
        </div>
      </div>
    </div>
  );
}
