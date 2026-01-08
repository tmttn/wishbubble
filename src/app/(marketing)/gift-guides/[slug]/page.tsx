import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/gift-guides/product-card";
import { CreateBubbleCta } from "@/components/cta/create-bubble-cta";

// Force dynamic rendering - page uses getLocale() which requires cookies/headers
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getGuide(slug: string) {
  return prisma.giftGuide.findUnique({
    where: { slug },
  });
}

async function getProducts(guide: NonNullable<Awaited<ReturnType<typeof getGuide>>>) {
  if (!guide.searchQuery) return [];

  const priceMin = guide.priceMin ? Number(guide.priceMin) : undefined;
  const priceMax = guide.priceMax ? Number(guide.priceMax) : undefined;

  const products = await prisma.feedProduct.findMany({
    where: {
      AND: [
        {
          OR: [
            { title: { contains: guide.searchQuery, mode: "insensitive" } },
            { searchText: { contains: guide.searchQuery, mode: "insensitive" } },
          ],
        },
        priceMin ? { price: { gte: priceMin } } : {},
        priceMax ? { price: { lte: priceMax } } : {},
        { availability: "IN_STOCK" },
      ],
    },
    take: 24,
    orderBy: { price: "asc" },
  });

  return products.map((p) => ({
    ...p,
    price: p.price ? Number(p.price) : null,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide || !guide.isPublished) {
    return { title: "Gift Guide Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

  return {
    title: `${guide.titleEn} - WishBubble`,
    description: guide.descriptionEn,
    keywords: guide.keywordsEn,
    openGraph: {
      title: guide.titleEn,
      description: guide.descriptionEn,
      type: "website",
      url: `${baseUrl}/gift-guides/${slug}`,
      images: guide.featuredImage
        ? [{ url: guide.featuredImage, alt: guide.titleEn }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.titleEn,
      description: guide.descriptionEn,
    },
    alternates: {
      canonical: `${baseUrl}/gift-guides/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  // During build phase, Prisma client is not available (no database access)
  // Return empty array to skip pre-rendering; pages will be generated on-demand (ISR)
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }

  const guides = await prisma.giftGuide.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });

  return guides.map((guide) => ({
    slug: guide.slug,
  }));
}

export default async function GiftGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("giftGuides");

  const guide = await getGuide(slug);

  if (!guide || !guide.isPublished) {
    notFound();
  }

  const products = await getProducts(guide);

  const title = locale === "nl" ? guide.titleNl : guide.titleEn;
  const description = locale === "nl" ? guide.descriptionNl : guide.descriptionEn;
  const content = locale === "nl" ? guide.contentNl : guide.contentEn;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description: description,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.title,
        description: product.description,
        image: product.imageUrl,
        url: product.affiliateUrl || product.url,
        offers: product.price
          ? {
              "@type": "Offer",
              price: product.price,
              priceCurrency: product.currency,
              availability: "https://schema.org/InStock",
            }
          : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container py-12">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/gift-guides">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToGuides")}
          </Link>
        </Button>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            {description}
          </p>
          {guide.priceMin || guide.priceMax ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {guide.priceMin && guide.priceMax
                ? t("priceRange", {
                    min: Number(guide.priceMin),
                    max: Number(guide.priceMax),
                  })
                : guide.priceMax
                ? t("priceUnder", { max: Number(guide.priceMax) })
                : null}
            </p>
          ) : null}
        </div>

        {/* Content */}
        {content && (
          <div
            className="prose prose-lg dark:prose-invert max-w-3xl mb-16"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* Products */}
        {products.length > 0 ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">{t("recommendedProducts")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  title={product.title}
                  description={product.description}
                  price={product.price}
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
        ) : (
          <div className="text-center py-12 mb-16">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noProducts")}</p>
          </div>
        )}

        {/* CTA */}
        <CreateBubbleCta variant="card" />
      </div>
    </>
  );
}
