import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");

  const sections = [
    "acceptance",
    "account",
    "content",
    "conduct",
    "termination",
    "disclaimer",
    "liability",
    "changes",
  ] as const;

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

          {sections.map((section) => (
            <section key={section} className="mt-8">
              <h2 className="text-xl font-semibold">
                {t(`sections.${section}.title`)}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t(`sections.${section}.content`)}
              </p>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
