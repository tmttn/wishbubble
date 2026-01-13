import { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  TreePine,
  Cake,
  Gift,
  Heart,
  Baby,
  GraduationCap,
  Home,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllOccasions } from "@/lib/occasion-content";

export const metadata: Metadata = {
  title: "Best Gift Ideas by Occasion 2026 | Free Wishlist App - WishBubble",
  description:
    "Find perfect gifts for Christmas, birthdays, weddings, baby showers & more. Create free wishlists, coordinate with family, avoid duplicate gifts. Start in 2 minutes!",
  keywords: [
    "gift ideas",
    "wishlist",
    "christmas gifts",
    "birthday gifts",
    "wedding registry",
    "baby shower gifts",
    "sinterklaas",
    "graduation gifts",
  ],
  openGraph: {
    title: "Best Gift Ideas by Occasion | WishBubble",
    description:
      "Find perfect gifts for every celebration. Free wishlist app for families and friends.",
    type: "website",
  },
};

const iconMap = {
  "tree-pine": TreePine,
  cake: Cake,
  gift: Gift,
  heart: Heart,
  baby: Baby,
  "graduation-cap": GraduationCap,
  home: Home,
};

export default async function OccasionsPage() {
  const locale = await getLocale();
  const t = await getTranslations("occasions");

  const occasions = getAllOccasions();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section with Dramatic Background */}
      <section className="relative py-20 md:py-32">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute -bottom-20 right-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] text-4xl animate-bounce" style={{ animationDuration: "3s" }}>🎁</div>
          <div className="absolute top-32 right-[15%] text-3xl animate-bounce" style={{ animationDuration: "4s", animationDelay: "0.5s" }}>✨</div>
          <div className="absolute bottom-32 left-[20%] text-3xl animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "1s" }}>🎉</div>
          <div className="absolute bottom-20 right-[25%] text-4xl animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "1.5s" }}>🎈</div>
        </div>

        <div className="container relative z-10 px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("badge")}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight mb-6">
              <span className="block">{t("heroTitle")}</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {t("heroTitleHighlight")}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("heroDescription")}
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-muted-foreground mb-12">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">{t("trustFree")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">{t("trustNoDuplicates")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">{t("trustSecretSanta")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Occasions Grid */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("chooseOccasion")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("chooseOccasionDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {occasions.map((occasion, index) => {
              const title = locale === "nl" ? occasion.titleNl : occasion.titleEn;
              const description =
                locale === "nl" ? occasion.descriptionNl : occasion.descriptionEn;
              const Icon = iconMap[occasion.icon];

              return (
                <Link
                  key={occasion.slug}
                  href={`/occasions/${occasion.slug}`}
                  className="group block"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-card/80 backdrop-blur-sm">
                    {/* Gradient header */}
                    <div
                      className={`h-32 bg-gradient-to-br ${occasion.gradient} relative overflow-hidden`}
                    >
                      {/* Pattern overlay */}
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0 0c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4z'/%3E%3C/g%3E%3C/svg%3E")`
                      }} />

                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-10 w-10 text-white" />
                        </div>
                      </div>

                      {/* Emoji decoration */}
                      <div className="absolute top-3 right-3 text-2xl opacity-80">
                        {occasion.emoji}
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="text-xl font-display font-bold mb-2 group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed">
                        {description}
                      </p>
                      <div
                        className="inline-flex items-center text-sm font-semibold group-hover:gap-3 gap-2 transition-all"
                        style={{ color: occasion.color }}
                      >
                        {t("viewGiftIdeas")}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("howItWorksTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("howItWorksDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Gift, step: "step1" },
              { icon: Users, step: "step2" },
              { icon: Star, step: "step3" },
            ].map((item, index) => (
              <div key={item.step} className="text-center relative">
                {/* Connection line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}

                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                    <item.icon className="h-9 w-9 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                </div>

                <h3 className="font-display font-bold text-xl mb-2">
                  {t(`howItWorks.${item.step}.title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`howItWorks.${item.step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="container relative z-10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              {t("ctaTitle")}
            </h2>
            <p className="text-xl md:text-2xl opacity-90 mb-10">
              {t("ctaDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-xl bg-white text-primary hover:bg-white/90 shadow-xl"
                asChild
              >
                <Link href="/register">
                  {t("ctaButton")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg rounded-xl border-2 border-white/50 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/guest-wishlist">
                  {t("ctaTryButton")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
