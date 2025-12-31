import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - WishBubble",
  description: "Learn how WishBubble collects, uses, and protects your personal information. GDPR compliant. Your privacy is important to us.",
  openGraph: {
    title: "Privacy Policy - WishBubble",
    description: "Learn how WishBubble collects, uses, and protects your personal information.",
  },
};

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");

  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-primary">GDPR Compliant</span>
          </div>
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <p className="text-muted-foreground">
            {t("lastUpdated", { date: "December 31, 2025" })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <p className="lead">{t("intro")}</p>

          {/* Data Controller */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.controller.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.controller.content")}</p>
          </section>

          {/* Legal Basis */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.legalBasis.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.legalBasis.intro")}</p>
            <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
              <li><strong>{t("sections.legalBasis.consent.title")}:</strong> {t("sections.legalBasis.consent.content")}</li>
              <li><strong>{t("sections.legalBasis.contract.title")}:</strong> {t("sections.legalBasis.contract.content")}</li>
              <li><strong>{t("sections.legalBasis.legitimate.title")}:</strong> {t("sections.legalBasis.legitimate.content")}</li>
              <li><strong>{t("sections.legalBasis.legal.title")}:</strong> {t("sections.legalBasis.legal.content")}</li>
            </ul>
          </section>

          {/* Data Collection */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.collection.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.collection.content")}</p>
            <h3 className="text-lg font-medium mt-4">{t("sections.collection.provided.title")}</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
              <li>{t("sections.collection.provided.items.account")}</li>
              <li>{t("sections.collection.provided.items.profile")}</li>
              <li>{t("sections.collection.provided.items.wishlists")}</li>
              <li>{t("sections.collection.provided.items.communications")}</li>
            </ul>
            <h3 className="text-lg font-medium mt-4">{t("sections.collection.automatic.title")}</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
              <li>{t("sections.collection.automatic.items.device")}</li>
              <li>{t("sections.collection.automatic.items.usage")}</li>
              <li>{t("sections.collection.automatic.items.cookies")}</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.use.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.use.content")}</p>
          </section>

          {/* Data Sharing */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.sharing.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.sharing.content")}</p>
            <h3 className="text-lg font-medium mt-4">{t("sections.sharing.processors.title")}</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
              <li>{t("sections.sharing.processors.items.hosting")}</li>
              <li>{t("sections.sharing.processors.items.email")}</li>
              <li>{t("sections.sharing.processors.items.auth")}</li>
            </ul>
          </section>

          {/* International Transfers */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.transfers.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.transfers.content")}</p>
          </section>

          {/* Data Security */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.security.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.security.content")}</p>
          </section>

          {/* Data Retention */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.retention.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.retention.content")}</p>
          </section>

          {/* Your Rights (GDPR) */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.rights.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.rights.intro")}</p>
            <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
              <li><strong>{t("sections.rights.access.title")}:</strong> {t("sections.rights.access.content")}</li>
              <li><strong>{t("sections.rights.rectification.title")}:</strong> {t("sections.rights.rectification.content")}</li>
              <li><strong>{t("sections.rights.erasure.title")}:</strong> {t("sections.rights.erasure.content")}</li>
              <li><strong>{t("sections.rights.restriction.title")}:</strong> {t("sections.rights.restriction.content")}</li>
              <li><strong>{t("sections.rights.portability.title")}:</strong> {t("sections.rights.portability.content")}</li>
              <li><strong>{t("sections.rights.objection.title")}:</strong> {t("sections.rights.objection.content")}</li>
              <li><strong>{t("sections.rights.withdraw.title")}:</strong> {t("sections.rights.withdraw.content")}</li>
            </ul>
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">{t("sections.rights.exercise")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">
                    <Download className="h-4 w-4 mr-2" />
                    {t("sections.rights.downloadData")}
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.cookies.title")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("sections.cookies.content")}{" "}
              <Link href="/cookies" className="text-primary hover:underline">
                {t("sections.cookies.link")}
              </Link>
            </p>
          </section>

          {/* Children */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.children.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.children.content")}</p>
          </section>

          {/* Changes */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.changes.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.changes.content")}</p>
          </section>

          {/* Supervisory Authority */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.authority.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.authority.content")}</p>
          </section>

          {/* Contact */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">{t("sections.contact.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("sections.contact.content")}</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
