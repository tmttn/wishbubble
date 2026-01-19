"use client";

import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const CATEGORIES = [
  "all",
  "electronics",
  "fashion",
  "home",
  "toys",
  "books",
  "beauty",
  "sports",
  "kitchen",
] as const;

export type Category = (typeof CATEGORIES)[number];

interface SearchCategoriesProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export function SearchCategories({ selected, onSelect }: SearchCategoriesProps) {
  const t = useTypedTranslations("search.categories");

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "min-h-[44px] shrink-0",
              selected === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {t(category)}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
