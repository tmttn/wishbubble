import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - WishBubble",
  description: "Read the Terms of Service for using WishBubble. By using our platform, you agree to these terms.",
  openGraph: {
    title: "Terms of Service - WishBubble",
    description: "Read the Terms of Service for using WishBubble.",
  },
};

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");

  const sections = [
    "acceptance",
    "age",
    "account",
    "content",
    "privacy",
    "conduct",
    "termination",
    "intellectual",
    "disclaimer",
    "liability",
    "indemnification",
    "changes",
    "governing",
    "severability",
    "contact",
  ] as const;

  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <p className="text-muted-foreground">
            {t("lastUpdated", { date: "December 31, 2024" })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <p className="lead">{t("intro")}</p>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Related policies:{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" | "}
              <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
            </p>
          </div>

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
