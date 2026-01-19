"use client";

import { useState } from "react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Grid, List, SlidersHorizontal } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "rating";
export type ViewMode = "grid" | "list";

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
}

interface SearchFiltersProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function SearchFilters({
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  const tSort = useTypedTranslations("search.sort");
  const tFilters = useTypedTranslations("search.filters");
  const tView = useTypedTranslations("search.view");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const cleared = { minPrice: undefined, maxPrice: undefined };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsFilterOpen(false);
  };

  const filterContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{tFilters("priceRange")}</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder={tFilters("minPrice")}
            value={localFilters.minPrice || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder={tFilters("maxPrice")}
            value={localFilters.maxPrice || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {/* Filter Button - Mobile: Bottom Sheet, Desktop: Popover */}
      {isMobile ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {tFilters("title")}
          </Button>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent side="bottom" showDragHandle>
              <SheetHeader>
                <SheetTitle>{tFilters("title")}</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                {filterContent}
              </div>
              <SheetFooter className="flex-row gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  {tFilters("clear")}
                </Button>
                <Button onClick={applyFilters} className="flex-1">
                  {tFilters("apply")}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {tFilters("title")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            {filterContent}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                {tFilters("clear")}
              </Button>
              <Button onClick={applyFilters} className="flex-1">
                {tFilters("apply")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Sort Dropdown */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-[140px] sm:w-[180px]">
          <SelectValue placeholder={tSort("title")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">{tSort("relevance")}</SelectItem>
          <SelectItem value="price_asc">{tSort("priceAsc")}</SelectItem>
          <SelectItem value="price_desc">{tSort("priceDesc")}</SelectItem>
          <SelectItem value="rating">{tSort("rating")}</SelectItem>
        </SelectContent>
      </Select>

      {/* View Toggle */}
      <div className="flex border rounded-lg">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("grid")}
          className="rounded-r-none"
          aria-label={tView("grid")}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("list")}
          className="rounded-l-none"
          aria-label={tView("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
