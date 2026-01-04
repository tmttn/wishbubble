import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ChevronRight, CheckCircle, Gift, Users, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getOccasionContent, getOccasionSlugs } from "@/lib/occasion-content";
import { OccasionHero } from "@/components/occasions/occasion-hero";
import { OccasionFaq } from "@/components/occasions/occasion-faq";
import { ProductCard } from "@/components/gift-guides/product-card";
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

  // Get products for this occasion
  const searchQuery = content.searchQueries[0];
  const products = await prisma.feedProduct.findMany({
    where: {
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { searchText: { contains: searchQuery, mode: "insensitive" } },
      ],
      availability: "IN_STOCK",
    },
    take: 12,
    orderBy: { price: "asc" },
  });

  const title = locale === "nl" ? content.titleNl : content.titleEn;
  const description = locale === "nl" ? content.descriptionNl : content.descriptionEn;

  const faqs = content.faqs.map((faq) => ({
    question: locale === "nl" ? faq.questionNl : faq.questionEn,
    answer: locale === "nl" ? faq.answerNl : faq.answerEn,
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

      {/* Why WishBubble Section */}
      <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("whyWishBubbleTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("whyWishBubbleDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Gift, key: "shareWishlists" },
              { icon: Users, key: "inviteEveryone" },
              { icon: Lock, key: "secretClaims" },
              { icon: Sparkles, key: "secretSanta" },
            ].map((item) => (
              <Card key={item.key} className="border-0 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <div
                    className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    style={{
                      backgroundColor: `${content.color}15`,
                    }}
                  >
                    <item.icon className="h-7 w-7" style={{ color: content.color }} />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">
                    {t(`whyFeatures.${item.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`whyFeatures.${item.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      {products.length > 0 && (
        <section className="py-16 container px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("giftIdeas")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("giftIdeasDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                price={product.price ? Number(product.price) : null}
                currency={product.currency}
                imageUrl={product.imageUrl}
                url={product.url}
                affiliateUrl={product.affiliateUrl}
                brand={product.brand}
                category={product.category}
              />
            ))}
          </div>
        </section>
      )}

      {/* Checklist Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {t("checklistTitle")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("checklistDescription")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card shadow-sm"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${content.color}15` }}
                  >
                    <CheckCircle className="h-5 w-5" style={{ color: content.color }} />
                  </div>
                  <div>
                    <p className="font-medium">{t(`checklist.item${num}`)}</p>
                  </div>
                </div>
              ))}
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
