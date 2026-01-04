"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OccasionHeroProps {
  title: string;
  description: string;
  color: string;
  occasionType: string;
}

export function OccasionHero({
  title,
  description,
  color,
  occasionType,
}: OccasionHeroProps) {
  const t = useTranslations("occasions");

  return (
    <div
      className="relative py-16 px-4 rounded-2xl mb-12"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
        borderWidth: 1,
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: `${color}20` }}
        >
          <Gift className="h-10 w-10" style={{ color }} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        <p className="text-xl text-muted-foreground mb-8">{description}</p>
        <Button size="lg" asChild>
          <Link href={`/bubbles/new?occasion=${occasionType}`}>
            <Plus className="h-5 w-5 mr-2" />
            {t("createBubble")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
