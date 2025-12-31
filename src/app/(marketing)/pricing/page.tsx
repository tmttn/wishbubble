"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Sparkles, Gift, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = {
  FREE: {
    name: "Free",
    description: "Perfect for getting started",
    icon: Gift,
    pricing: { monthly: 0, yearly: 0 },
    limits: {
      groups: 2,
      membersPerGroup: 8,
      wishlists: 3,
      itemsPerWishlist: 20,
    },
    features: [
      { name: "Create up to 2 groups", included: true },
      { name: "Up to 8 members per group", included: true },
      { name: "3 wishlists with 20 items each", included: true },
      { name: "Join unlimited groups", included: true },
      { name: "Basic notifications", included: true },
      { name: "Secret Santa", included: false },
      { name: "Priority support", included: false },
    ],
  },
  PREMIUM: {
    name: "Premium",
    description: "For active gift-givers",
    icon: Crown,
    pricing: { monthly: 499, yearly: 3999 },
    limits: {
      groups: 10,
      membersPerGroup: 25,
      wishlists: -1,
      itemsPerWishlist: -1,
    },
    features: [
      { name: "Create up to 10 groups", included: true },
      { name: "Up to 25 members per group", included: true },
      { name: "Unlimited wishlists & items", included: true },
      { name: "Join unlimited groups", included: true },
      { name: "Email notifications", included: true },
      { name: "Secret Santa", included: true },
      { name: "Priority support", included: true },
      { name: "Early access to new features", included: true },
    ],
    popular: true,
  },
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isYearly, setIsYearly] = useState(true);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const canceled = searchParams.get("canceled") === "true";

  const handleSubscribe = async (tier: "PREMIUM") => {
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
      } else {
        console.error("No checkout URL returned:", data);
        alert(`Checkout failed: ${data.details || data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const yearlySavings = Math.round(
    ((PLANS.PREMIUM.pricing.monthly * 12 - PLANS.PREMIUM.pricing.yearly) /
      (PLANS.PREMIUM.pricing.monthly * 12)) *
      100
  );

  return (
    <div className="container max-w-6xl py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="h-3 w-3 mr-1" />
          Simple, transparent pricing
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Choose the perfect plan for your gift-giving
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start for free and upgrade when you need more groups, members, or want to use Secret Santa.
        </p>

        {canceled && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg max-w-md mx-auto">
            Checkout was canceled. Feel free to try again when you&apos;re ready!
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label htmlFor="billing-toggle" className={cn(!isYearly && "text-foreground", isYearly && "text-muted-foreground")}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={cn(isYearly && "text-foreground", !isYearly && "text-muted-foreground")}>
          Yearly
          <Badge variant="secondary" className="ml-2 text-xs">
            Save {yearlySavings}%
          </Badge>
        </Label>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Gift className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-2xl">{PLANS.FREE.name}</CardTitle>
            <CardDescription>{PLANS.FREE.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">€0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3">
              {PLANS.FREE.features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
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
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href={session ? "/dashboard" : "/register"}>
                {session ? "Go to Dashboard" : "Get Started"}
              </a>
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-primary shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{PLANS.PREMIUM.name}</CardTitle>
            <CardDescription>{PLANS.PREMIUM.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {formatPrice(isYearly ? Math.round(PLANS.PREMIUM.pricing.yearly / 12) : PLANS.PREMIUM.pricing.monthly)}
              </span>
              <span className="text-muted-foreground">/month</span>
              {isYearly && (
                <div className="text-sm text-muted-foreground">
                  Billed as {formatPrice(PLANS.PREMIUM.pricing.yearly)}/year
                </div>
              )}
            </div>
            <ul className="space-y-3">
              {PLANS.PREMIUM.features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleSubscribe("PREMIUM")}
              disabled={isLoading !== null}
            >
              {isLoading === "PREMIUM" ? (
                "Loading..."
              ) : (
                <>
                  Start 14-day free trial
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Can I try Premium for free?</h3>
            <p className="text-muted-foreground">
              Yes! Every Premium subscription starts with a 14-day free trial. You won&apos;t be charged until the trial ends, and you can cancel anytime.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What happens when I hit a limit on the Free plan?</h3>
            <p className="text-muted-foreground">
              You&apos;ll see a friendly prompt to upgrade. Your existing data is never deleted - you just won&apos;t be able to create more until you upgrade or free up space.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-muted-foreground">
              Absolutely! You can cancel your subscription at any time from your billing settings. You&apos;ll keep Premium access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards, debit cards, and Apple Pay through our secure payment provider, Stripe.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Do I need Premium to join a group?</h3>
            <p className="text-muted-foreground">
              No! You can join unlimited groups for free. Premium is only needed if you want to create more groups or use features like Secret Santa as a group owner.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Join thousands of happy gift-givers</span>
        </div>
      </div>
    </div>
  );
}
