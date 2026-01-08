import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Gift } from "lucide-react";
import { GuideCard } from "@/components/gift-guides/guide-card";
import { CreateBubbleCta } from "@/components/cta/create-bubble-cta";

// Force dynamic rendering - page uses getLocale() which requires cookies/headers
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gift Guides - WishBubble",
  description:
    "Discover curated gift ideas for every occasion and budget. Find the perfect gifts for Christmas, birthdays, weddings, and more.",
  openGraph: {
    title: "Gift Guides - WishBubble",
    description:
      "Discover curated gift ideas for every occasion and budget.",
    type: "website",
  },
};

export default async function GiftGuidesPage() {
  const locale = await getLocale();
  const t = await getTranslations("giftGuides");

  const guides = await prisma.giftGuide.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
  });

  // Group by category
  const byOccasion = guides.filter((g) => g.category === "occasion");
  const byBudget = guides.filter((g) => g.category === "budget");
  const byRecipient = guides.filter((g) => g.category === "recipient");
  const uncategorized = guides.filter((g) => !g.category);

  const getTitle = (guide: typeof guides[0]) =>
    locale === "nl" ? guide.titleNl : guide.titleEn;

  const getDescription = (guide: typeof guides[0]) =>
    locale === "nl" ? guide.descriptionNl : guide.descriptionEn;

  const renderGuideSection = (
    title: string,
    guides: typeof byOccasion
  ) => {
    if (guides.length === 0) return null;

    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <GuideCard
              key={guide.id}
              slug={guide.slug}
              title={getTitle(guide)}
              description={getDescription(guide)}
              featuredImage={guide.featuredImage}
              priceMin={guide.priceMin ? Number(guide.priceMin) : null}
              priceMax={guide.priceMax ? Number(guide.priceMax) : null}
              category={guide.category}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="container py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{t("pageTitle")}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("pageDescription")}
        </p>
      </div>

      {guides.length === 0 ? (
        <div className="text-center py-16">
          <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("noGuides")}</h2>
          <p className="text-muted-foreground">{t("noGuidesDescription")}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {renderGuideSection(t("categories.byOccasion"), byOccasion)}
          {renderGuideSection(t("categories.byBudget"), byBudget)}
          {renderGuideSection(t("categories.byRecipient"), byRecipient)}
          {renderGuideSection(t("categories.other"), uncategorized)}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16">
        <CreateBubbleCta variant="card" />
      </div>
    </div>
  );
}
