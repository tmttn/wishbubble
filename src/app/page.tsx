import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gift,
  Users,
  Lock,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const t = await getTranslations("home");

  const features = [
    {
      icon: Users,
      titleKey: "groupFirst" as const,
    },
    {
      icon: Lock,
      titleKey: "privacyAware" as const,
    },
    {
      icon: Gift,
      titleKey: "secretSanta" as const,
    },
    {
      icon: Sparkles,
      titleKey: "reusable" as const,
    },
  ];

  const steps = ["step1", "step2", "step3", "step4"] as const;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl" aria-hidden="true">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary to-purple-400 opacity-20" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("features.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Traditional wishlists are personal. WishBubble is social.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.titleKey} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {t(`features.${feature.titleKey}.title`)}
                      </h3>
                      <p className="mt-2 text-muted-foreground">
                        {t(`features.${feature.titleKey}.description`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("howItWorks.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in minutes, not hours
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-semibold text-lg">
                  {t(`howItWorks.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`howItWorks.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl bg-gradient-to-r from-primary to-purple-600 p-8 md:p-12 text-center text-white">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to simplify gift-giving?
              </h2>
              <p className="mt-4 text-lg opacity-90">
                Join thousands of families and friend groups who use WishBubble
                for their gift exchanges.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-8">
                <div>
                  <div className="text-3xl font-bold">10,000+</div>
                  <div className="text-sm opacity-80">Happy Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">25,000+</div>
                  <div className="text-sm opacity-80">Bubbles Created</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">100,000+</div>
                  <div className="text-sm opacity-80">Gifts Coordinated</div>
                </div>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="mt-8"
                asChild
              >
                <Link href="/register">
                  Create Your First Bubble
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("pricing.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Create bubbles with up to 10 members and 25 wishlist items for free.
              Upgrade anytime for unlimited features.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Unlimited bubbles</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Secret Santa draw</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Email invitations</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Claim coordination</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
