"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdminClientPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  showPerPageSelector?: boolean;
  perPageOptions?: number[];
}

export function AdminClientPagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  showPerPageSelector = true,
  perPageOptions = [10, 20, 50, 100],
}: AdminClientPaginationProps) {
  const t = useTranslations("admin.common");

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  if (totalPages <= 1 && !showPerPageSelector) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {t("showing")} {startItem}-{endItem} {t("of")} {total}
        </span>
        {showPerPageSelector && onPerPageChange && (
          <div className="flex items-center gap-2">
            <span>{t("perPage")}:</span>
            <Select
              value={String(perPage)}
              onValueChange={(value) => onPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-[70px] h-8 bg-card/80 backdrop-blur-sm border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/80 backdrop-blur-sm border-0"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/80 backdrop-blur-sm border-0"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {generatePageNumbers(page, totalPages).map((pageNum, idx) =>
              pageNum === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 ${pageNum !== page ? "bg-card/80 backdrop-blur-sm border-0" : ""}`}
                  onClick={() => onPageChange(pageNum as number)}
                >
                  {pageNum}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/80 backdrop-blur-sm border-0"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/80 backdrop-blur-sm border-0"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}
