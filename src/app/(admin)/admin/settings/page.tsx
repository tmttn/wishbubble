import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Settings } from "lucide-react";
import { OwnerDigestSettings } from "./owner-digest-settings";

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin.settingsPage");

  // Get or create digest settings
  let digestSettings = await prisma.ownerDigestSettings.findFirst();
  if (!digestSettings) {
    digestSettings = await prisma.ownerDigestSettings.create({
      data: {
        id: "singleton",
        frequency: "DAILY",
        deliveryHour: 8,
        weeklyDay: 1,
      },
    });
  }

  const ownerEmail = process.env.OWNER_EMAIL || null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
          <Settings className="h-8 w-8 text-cyan-600" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Owner Digest Settings */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <Mail className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <CardTitle>{t("ownerDigest.title")}</CardTitle>
              <CardDescription>{t("ownerDigest.description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OwnerDigestSettings
            settings={{
              id: digestSettings.id,
              frequency: digestSettings.frequency,
              deliveryHour: digestSettings.deliveryHour,
              weeklyDay: digestSettings.weeklyDay,
              lastSentAt: digestSettings.lastSentAt?.toISOString() || null,
            }}
            ownerEmail={ownerEmail}
          />
        </CardContent>
      </Card>
    </div>
  );
}
