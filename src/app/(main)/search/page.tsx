import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SearchPageClient } from "@/components/search/search-page-client";
import { Loader2 } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("search");
  return {
    title: t("title"),
  };
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default async function SearchPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageClient />
    </Suspense>
  );
}
