"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CreateBubbleCtaProps {
  occasionType?: string;
  variant?: "default" | "card";
}

export function CreateBubbleCta({
  occasionType,
  variant = "default",
}: CreateBubbleCtaProps) {
  const t = useTranslations("cta");

  const href = occasionType
    ? `/bubbles/new?occasion=${occasionType}`
    : "/bubbles/new";

  if (variant === "card") {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("createBubble.title")}</h3>
                <p className="text-muted-foreground">
                  {t("createBubble.description")}
                </p>
              </div>
            </div>
            <Button size="lg" asChild>
              <Link href={href}>
                <Plus className="h-5 w-5 mr-2" />
                {t("createBubble.button")}
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{t("createBubble.features.inviteFamily")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span>{t("createBubble.features.shareWishlists")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-6 rounded-lg bg-muted/50">
      <div className="flex-1">
        <h3 className="font-semibold">{t("createBubble.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("createBubble.description")}
        </p>
      </div>
      <Button asChild>
        <Link href={href}>
          <Plus className="h-4 w-4 mr-2" />
          {t("createBubble.button")}
        </Link>
      </Button>
    </div>
  );
}
