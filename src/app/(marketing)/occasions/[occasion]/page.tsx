import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ChevronRight, CheckCircle, Lightbulb, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOccasionContent, getOccasionSlugs } from "@/lib/occasion-content";
import { OccasionHero } from "@/components/occasions/occasion-hero";
import { OccasionFaq } from "@/components/occasions/occasion-faq";
import { CreateBubbleCta } from "@/components/cta/create-bubble-cta";

interface PageProps {
  params: Promise<{ occasion: string }>;
}

export async function generateStaticParams() {
  const slugs = getOccasionSlugs();
  return slugs.map((occasion) => ({ occasion }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { occasion } = await params;
  const content = getOccasionContent(occasion);

  if (!content) {
    return { title: "Occasion Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
  const currentYear = new Date().getFullYear();

  return {
    title: `Best ${content.titleEn} ${currentYear} | Free Wishlist - WishBubble`,
    description: `${content.descriptionEn} Create free wishlists, coordinate with family, and never get duplicate gifts again.`,
    keywords: content.searchQueries,
    openGraph: {
      title: `${content.titleEn} - Free Wishlist App`,
      description: content.descriptionEn,
      type: "website",
      url: `${baseUrl}/occasions/${occasion}`,
    },
    twitter: {
      card: "summary_large_image",
      title: content.titleEn,
      description: content.descriptionEn,
    },
    alternates: {
      canonical: `${baseUrl}/occasions/${occasion}`,
    },
  };
}

export default async function OccasionPage({ params }: PageProps) {
  const { occasion } = await params;
  const locale = await getLocale();
  const t = await getTranslations("occasions");

  const content = getOccasionContent(occasion);

  if (!content) {
    notFound();
  }

  const title = locale === "nl" ? content.titleNl : content.titleEn;
  const description = locale === "nl" ? content.descriptionNl : content.descriptionEn;

  const faqs = content.faqs.map((faq) => ({
    question: locale === "nl" ? faq.questionNl : faq.questionEn,
    answer: locale === "nl" ? faq.answerNl : faq.answerEn,
  }));

  // Get localized tips
  const tips = content.tips.map((tip) => ({
    title: locale === "nl" ? tip.titleNl : tip.titleEn,
    text: locale === "nl" ? tip.textNl : tip.textEn,
    emoji: tip.emoji,
  }));

  // Get localized checklist
  const checklist = content.checklist.map((item) => ({
    text: locale === "nl" ? item.textNl : item.textEn,
  }));

  // Get localized gift categories
  const giftCategories = content.giftCategories.map((category) => ({
    name: locale === "nl" ? category.nameNl : category.nameEn,
    emoji: category.emoji,
    ideas: category.ideas.map((idea) => ({
      name: locale === "nl" ? idea.nameNl : idea.nameEn,
      description: locale === "nl" ? idea.descriptionNl : idea.descriptionEn,
      priceRange: idea.priceRange,
      emoji: idea.emoji,
    })),
  }));

  // Map occasion slug to OccasionType for bubble creation
  const occasionTypeMap: Record<string, string> = {
    christmas: "CHRISTMAS",
    birthday: "BIRTHDAY",
    sinterklaas: "SINTERKLAAS",
    wedding: "WEDDING",
    "baby-shower": "BABY_SHOWER",
    graduation: "GRADUATION",
    housewarming: "HOUSEWARMING",
  };

  const occasionType = occasionTypeMap[occasion] || "OTHER";

  // Breadcrumb structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://wish-bubble.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "nl" ? "Gelegenheden" : "Occasions",
        item: "https://wish-bubble.app/occasions",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `https://wish-bubble.app/occasions/${occasion}`,
      },
    ],
  };

  return (
    <div className="relative overflow-hidden">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb navigation */}
      <div className="container pt-6 px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/occasions" className="hover:text-foreground transition-colors">
            {locale === "nl" ? "Gelegenheden" : "Occasions"}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{title}</span>
        </nav>

        {/* Back button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/occasions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToOccasions")}
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <div className="container px-4 sm:px-6">
        <OccasionHero
          title={title}
          description={description}
          color={content.color}
          gradient={content.gradient}
          icon={content.icon}
          emoji={content.emoji}
          occasionType={occasionType}
        />
      </div>

      {/* Expert Tips Section */}
      <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {locale === "nl" ? "Expert Tips" : "Expert Tips"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {locale === "nl" ? "Tips voor het Perfecte Cadeau" : "Tips for the Perfect Gift"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {locale === "nl"
                ? "Praktische adviezen om cadeau geven makkelijker en leuker te maken"
                : "Practical advice to make gift-giving easier and more enjoyable"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {tips.map((tip, index) => (
              <Card
                key={index}
                className="border-0 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${content.color}15` }}
                    >
                      {tip.emoji}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg mb-2">{tip.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{tip.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gift Ideas by Category */}
      <section className="py-16">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {locale === "nl" ? "Cadeau Ideeën" : "Gift Ideas"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {locale === "nl"
                ? "Handgeselecteerde cadeau-inspiratie voor elke smaak en budget"
                : "Hand-picked gift inspiration for every taste and budget"}
            </p>
          </div>

          <div className="space-y-12 max-w-6xl mx-auto">
            {giftCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{category.emoji}</span>
                  <h3 className="text-2xl font-display font-bold">{category.name}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.ideas.map((idea, ideaIndex) => (
                    <Card
                      key={ideaIndex}
                      className="group border hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-2xl">{idea.emoji}</span>
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium"
                            style={{
                              backgroundColor: `${content.color}15`,
                              color: content.color,
                            }}
                          >
                            {idea.priceRange}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                          {idea.name}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {idea.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Search for more gifts CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              {locale === "nl"
                ? "Wil je meer inspiratie? Bekijk onze cadeaugidsen!"
                : "Want more inspiration? Check out our gift guides!"}
            </p>
            <Button variant="outline" size="lg" className="rounded-xl" asChild>
              <Link href="/gift-guides">
                {locale === "nl" ? "Bekijk Cadeaugidsen" : "Browse Gift Guides"}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Checklist Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {locale === "nl" ? "Cadeau Checklist" : "Gift-Giving Checklist"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {locale === "nl"
                  ? "Zorg dat je niets vergeet met deze handige checklist"
                  : "Make sure you don't forget anything with this handy checklist"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklist.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${content.color}15` }}
                  >
                    <CheckCircle className="h-5 w-5" style={{ color: content.color }} />
                  </div>
                  <div>
                    <p className="font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="py-16">
        <div className="container px-4 sm:px-6">
          <div
            className="max-w-4xl mx-auto rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{ backgroundColor: `${content.color}10` }}
          >
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(content.color)}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative z-10">
              <span className="text-5xl mb-4 block">{content.emoji}</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                {locale === "nl"
                  ? "Klaar om je verlanglijst te maken?"
                  : "Ready to create your wishlist?"}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                {locale === "nl"
                  ? "Deel je wensen met familie en vrienden. Vermijd dubbele cadeaus en krijg precies wat je wilt!"
                  : "Share your wishes with family and friends. Avoid duplicate gifts and get exactly what you want!"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="rounded-xl shadow-lg"
                  style={{
                    backgroundColor: content.color,
                    boxShadow: `0 10px 30px -5px ${content.color}40`,
                  }}
                  asChild
                >
                  <Link href={`/bubbles/new?occasion=${occasionType}`}>
                    {locale === "nl" ? "Maak Gratis Bubble" : "Create Free Bubble"}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-xl" asChild>
                  <Link href="/guest-wishlist">
                    {locale === "nl" ? "Probeer Zonder Account" : "Try Without Account"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 container px-4 sm:px-6">
        <OccasionFaq faqs={faqs} occasionTitle={title} />
      </section>

      {/* CTA */}
      <section className="py-16 container px-4 sm:px-6">
        <CreateBubbleCta occasionType={occasionType} variant="card" />
      </section>
    </div>
  );
}
