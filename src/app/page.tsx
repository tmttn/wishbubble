import { Metadata } from "next";
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
  Star,
  Heart,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

// Cache stats for 1 hour
const getPublicStats = unstable_cache(
  async () => {
    const [userCount, bubbleCount, wishlistItemCount] = await Promise.all([
      prisma.user.count({
        where: { deletedAt: null },
      }),
      prisma.bubble.count({
        where: { archivedAt: null },
      }),
      prisma.wishlistItem.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      users: userCount,
      bubbles: bubbleCount,
      wishes: wishlistItemCount,
    };
  },
  ["public-stats"],
  { revalidate: 3600 }
);

export const metadata: Metadata = {
  title: "WishBubble - Share Wishlists, Coordinate Gifts",
  description: "Create gift groups for family, friends, or coworkers. Share wishlists, claim gifts secretly, and run Secret Santa draws. Free for groups up to 8 people.",
  keywords: [
    "wishlist app",
    "secret santa",
    "gift exchange",
    "christmas wishlist",
    "birthday wishlist",
    "group wishlist",
    "gift coordination",
    "family wishlist",
    "verlanglijst",
    "sinterklaas",
    "gift registry",
  ],
  openGraph: {
    title: "WishBubble - Share Wishlists, Coordinate Gifts",
    description: "Create gift groups for family, friends, or coworkers. Share wishlists, claim gifts secretly, and run Secret Santa draws. Free for groups up to 8 people.",
    type: "website",
    url: "https://wish-bubble.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "WishBubble - Share Wishlists, Coordinate Gifts",
    description: "Create gift groups for family, friends, or coworkers. Share wishlists, claim gifts secretly, and run Secret Santa draws. Free for groups up to 8 people.",
  },
  alternates: {
    canonical: "https://wish-bubble.app",
  },
};

export default async function HomePage() {
  const [t, stats] = await Promise.all([
    getTranslations("home"),
    getPublicStats(),
  ]);

  const features = [
    {
      icon: Users,
      titleKey: "groupFirst" as const,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Lock,
      titleKey: "privacyAware" as const,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Gift,
      titleKey: "secretSanta" as const,
      gradient: "from-rose-500 to-orange-500",
    },
    {
      icon: Sparkles,
      titleKey: "reusable" as const,
      gradient: "from-orange-500 to-amber-500",
    },
  ];

  const steps = ["step1", "step2", "step3", "step4"] as const;

  const stepIcons = [Users, Gift, Heart, Zap];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-mesh">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container relative z-10 px-4 sm:px-6 py-12 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 md:mb-8 animate-slide-down">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("hero.badge")}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up">
              <span className="block">{t("hero.title")}</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                {t("hero.titleHighlight")}
              </span>
            </h1>

            <p className="mt-6 md:mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up px-4" style={{ animationDelay: "0.1s" }}>
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-4 justify-center px-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="group h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25" asChild>
                <Link href="/register">
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-xl border-2 hover:bg-secondary/50" asChild>
                <Link href="#features">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-6 md:gap-8 text-muted-foreground animate-slide-up px-4" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">{t("hero.trustFree")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">{t("hero.trustNoCard")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">{t("hero.trustSetup")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-soft hidden md:block">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 lg:py-32 bg-gradient-subtle scroll-mt-20">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {t("features.title")}
            </h2>
            <p className="mt-4 md:mt-6 text-lg text-muted-foreground">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="mx-auto max-w-6xl grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
            {features.map((feature, index) => (
              <Card
                key={feature.titleKey}
                className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm card-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                    <div className={`shrink-0 rounded-2xl bg-gradient-to-br ${feature.gradient} p-3 md:p-4 shadow-lg`}>
                      <feature.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg md:text-xl mb-2">
                        {t(`features.${feature.titleKey}.title`)}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {t(`features.${feature.titleKey}.description`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />

        <div className="container relative z-10 px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {t("howItWorks.title")}
            </h2>
            <p className="mt-4 md:mt-6 text-lg text-muted-foreground">
              {t("howItWorks.subtitle")}
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = stepIcons[index];
                return (
                  <div key={step} className="relative text-center group">
                    {/* Connection line - hidden on mobile */}
                    {index < 3 && (
                      <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                    )}

                    <div className="relative mx-auto mb-6">
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-xl scale-150 group-hover:opacity-40 transition-opacity" />
                      {/* Number circle */}
                      <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                        <Icon className="h-7 w-7 md:h-8 md:w-8" />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg md:text-xl mb-2">
                      {t(`howItWorks.${step}.title`)}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed px-2">
                      {t(`howItWorks.${step}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }} />

              <div className="relative p-8 md:p-12 lg:p-16 text-center text-primary-foreground">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  {t("socialProof.title")}
                </h2>
                <p className="mt-4 md:mt-6 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
                  {t("socialProof.subtitle")}
                </p>

                <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
                  {[
                    { value: stats.users, labelKey: "users" },
                    { value: stats.bubbles, labelKey: "bubbles" },
                    { value: stats.wishes, labelKey: "gifts" },
                  ].map((stat, index) => (
                    <div
                      key={stat.labelKey}
                      className="p-4 md:p-6 rounded-2xl bg-white/10 backdrop-blur-sm"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-3xl md:text-4xl font-bold">{stat.value.toLocaleString()}</div>
                      <div className="text-sm md:text-base opacity-80 mt-1">{t(`socialProof.stats.${stat.labelKey}`)}</div>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="mt-10 md:mt-12 h-12 md:h-14 px-8 md:px-10 text-base md:text-lg rounded-xl bg-white text-primary hover:bg-white/90 shadow-xl"
                  asChild
                >
                  <Link href="/register">
                    {t("socialProof.cta")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-subtle">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {t("pricing.title")}
            </h2>
            <p className="mt-4 md:mt-6 text-lg text-muted-foreground">
              {t("pricing.subtitle")}
            </p>

            <div className="mt-10 md:mt-12 grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {/* Free Plan */}
              <Card className="p-6 md:p-8 text-left border-2">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{t("pricing.free.name")}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{t("pricing.free.description")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">€0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {["groups", "members", "wishlists", "items"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{t(`pricing.free.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <Link href="/register">{t("pricing.free.cta")}</Link>
                </Button>
              </Card>

              {/* Premium Plan */}
              <Card className="p-6 md:p-8 text-left border-2 border-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  {t("pricing.premium.badge")}
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{t("pricing.premium.name")}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{t("pricing.premium.description")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">€4.99</span>
                  <span className="text-muted-foreground">/month</span>
                  <p className="text-sm text-muted-foreground mt-1">{t("pricing.premium.yearly")}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {["groups", "members", "wishlists", "secretSanta", "adFree", "trial"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{t(`pricing.premium.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
                  <Link href="/pricing">{t("pricing.premium.cta")}</Link>
                </Button>
              </Card>
            </div>

            <p className="mt-8 text-muted-foreground">
              <Link href="/pricing" className="text-primary hover:underline">
                {t("pricing.viewAll")}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {t("faq.title")}
            </h2>
            <p className="mt-4 md:mt-6 text-lg text-muted-foreground">
              {t("faq.subtitle")}
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    {t(`faq.items.${index}.question`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`faq.items.${index}.answer`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
