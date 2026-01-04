import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return {
    title: `${content.titleEn} - WishBubble`,
    description: content.descriptionEn,
    openGraph: {
      title: content.titleEn,
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

  return (
    <div className="container py-12">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/occasions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToOccasions")}
        </Link>
      </Button>

      {/* Hero */}
      <OccasionHero
        title={title}
        description={description}
        color={content.color}
        occasionType={occasionType}
      />

      {/* Products */}
      {products.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t("giftIdeas")}</h2>
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

      {/* FAQ */}
      <OccasionFaq faqs={faqs} occasionTitle={title} />

      {/* CTA */}
      <div className="mt-12">
        <CreateBubbleCta occasionType={occasionType} variant="card" />
      </div>
    </div>
  );
}
