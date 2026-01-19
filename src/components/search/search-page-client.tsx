"use client";

import { useTypedTranslations } from "@/i18n/useTypedTranslations";

export function SearchPageClient() {
  const t = useTypedTranslations("search");

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
      </div>
    </div>
  );
}
