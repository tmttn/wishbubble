import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cookie Policy - WishBubble",
  description: "Learn about how WishBubble uses cookies and similar technologies to improve your experience.",
  openGraph: {
    title: "Cookie Policy - WishBubble",
    description: "Learn about how WishBubble uses cookies and similar technologies.",
  },
};

export default async function CookiesPage() {
  const t = await getTranslations("legal.cookiePolicy");

  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <p className="text-muted-foreground">
            {t("lastUpdated", { date: "December 30, 2024" })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <p className="lead">{t("intro")}</p>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              {t("sections.what.title")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("sections.what.content")}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              {t("sections.types.title")}
            </h2>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              <li>{t("sections.types.items.necessary")}</li>
              <li>{t("sections.types.items.analytics")}</li>
              <li>{t("sections.types.items.preferences")}</li>
              <li>{t("sections.types.items.marketing")}</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              {t("sections.control.title")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("sections.control.content")}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              {t("sections.thirdParty.title")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("sections.thirdParty.content")}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
