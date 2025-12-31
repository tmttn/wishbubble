import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Shield } from "lucide-react";
import { CookiePreferencesButton } from "@/components/layout/cookie-preferences-button";

export const metadata: Metadata = {
  title: "Cookie Policy - WishBubble",
  description: "Learn about how WishBubble uses cookies and similar technologies. GDPR compliant with full transparency.",
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
          <div className="flex items-center gap-2 mb-2">
            <Cookie className="h-6 w-6 text-primary" />
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">GDPR Compliant</span>
          </div>
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <p className="text-muted-foreground">
            {t("lastUpdated", { date: "December 31, 2025" })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <p className="lead">{t("intro")}</p>

          {/* Manage Preferences Button */}
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 not-prose">
            <p className="text-sm font-medium mb-3">{t("sections.control.content")}</p>
            <CookiePreferencesButton />
          </div>

          {/* What Are Cookies */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.what.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.what.content")}</p>
          </section>

          {/* Legal Basis */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.legalBasis.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.legalBasis.content")}</p>
          </section>

          {/* Cookie Types */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.types.title")}</h2>

            {/* Essential Cookies */}
            <div className="mt-6 p-4 border rounded-lg bg-green-500/5 border-green-500/20">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {t("sections.types.necessary.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("sections.types.necessary.description")}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>{t("sections.types.necessary.items.session")}</li>
                <li>{t("sections.types.necessary.items.csrf")}</li>
                <li>{t("sections.types.necessary.items.consent")}</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{t("sections.types.necessary.retention")}</p>
            </div>

            {/* Analytics Cookies */}
            <div className="mt-4 p-4 border rounded-lg opacity-60">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {t("sections.types.analytics.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("sections.types.analytics.description")}</p>
              <p className="mt-2 text-xs text-muted-foreground italic">{t("sections.types.analytics.items.none")}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("sections.types.analytics.retention")}</p>
            </div>

            {/* Preference Cookies */}
            <div className="mt-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {t("sections.types.preferences.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("sections.types.preferences.description")}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>{t("sections.types.preferences.items.locale")}</li>
                <li>{t("sections.types.preferences.items.theme")}</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{t("sections.types.preferences.retention")}</p>
            </div>

            {/* Marketing Cookies */}
            <div className="mt-4 p-4 border rounded-lg opacity-60">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                {t("sections.types.marketing.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("sections.types.marketing.description")}</p>
              <p className="mt-2 text-xs text-muted-foreground italic">{t("sections.types.marketing.items.none")}</p>
            </div>
          </section>

          {/* Browser Settings */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.control.title")}</h2>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>{t("sections.control.browsers.chrome")}</li>
              <li>{t("sections.control.browsers.firefox")}</li>
              <li>{t("sections.control.browsers.safari")}</li>
              <li>{t("sections.control.browsers.edge")}</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">{t("sections.control.note")}</p>
          </section>

          {/* Third-Party Cookies */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.thirdParty.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.thirdParty.content")}</p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>{t("sections.thirdParty.services.googleAuth")}</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">{t("sections.thirdParty.note")}</p>
          </section>

          {/* Updates */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.updates.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.updates.content")}</p>
          </section>

          {/* Contact */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.contact.title")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("sections.contact.content")}{" "}
              <Link href="/contact" className="text-primary hover:underline">
                {t("sections.contact.link")}
              </Link>
            </p>
          </section>

          {/* Related Policies */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Related policies:{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" | "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
