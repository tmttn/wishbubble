import { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Gift, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllOccasions } from "@/lib/occasion-content";

export const metadata: Metadata = {
  title: "Gift Ideas by Occasion - WishBubble",
  description:
    "Find the perfect gifts for every occasion. Christmas, birthdays, weddings, baby showers, and more. Create wishlists and coordinate with family.",
  openGraph: {
    title: "Gift Ideas by Occasion - WishBubble",
    description:
      "Find the perfect gifts for every occasion. Create wishlists and coordinate with family.",
    type: "website",
  },
};

export default async function OccasionsPage() {
  const locale = await getLocale();
  const t = await getTranslations("occasions");

  const occasions = getAllOccasions();

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

      {/* Occasions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {occasions.map((occasion) => {
          const title = locale === "nl" ? occasion.titleNl : occasion.titleEn;
          const description =
            locale === "nl" ? occasion.descriptionNl : occasion.descriptionEn;

          return (
            <Link key={occasion.slug} href={`/occasions/${occasion.slug}`}>
              <Card
                className="h-full hover:shadow-lg transition-all hover:-translate-y-1"
                style={{
                  borderColor: `${occasion.color}30`,
                }}
              >
                <CardContent className="p-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${occasion.color}15` }}
                  >
                    <Gift className="h-6 w-6" style={{ color: occasion.color }} />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{title}</h2>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {description}
                  </p>
                  <div
                    className="inline-flex items-center text-sm font-medium"
                    style={{ color: occasion.color }}
                  >
                    {t("viewGiftIdeas")}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
