"use client";

import Link from "next/link";
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

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  showPerPageSelector?: boolean;
  perPageOptions?: number[];
}

export function AdminPagination({
  page,
  totalPages,
  total,
  perPage,
  baseUrl,
  searchParams = {},
  showPerPageSelector = true,
  perPageOptions = [10, 20, 50, 100],
}: AdminPaginationProps) {
  const t = useTranslations("admin.common");

  const buildUrl = (newPage: number, newPerPage?: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && key !== "page" && key !== "perPage") {
        params.set(key, value);
      }
    });
    if (newPage > 1) {
      params.set("page", String(newPage));
    }
    if (newPerPage && newPerPage !== 20) {
      params.set("perPage", String(newPerPage));
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

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
        {showPerPageSelector && (
          <div className="flex items-center gap-2">
            <span>{t("perPage")}:</span>
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                window.location.href = buildUrl(1, parseInt(value));
              }}
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
            asChild={page > 1}
          >
            {page > 1 ? (
              <Link href={buildUrl(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronsLeft className="h-4 w-4" />
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/80 backdrop-blur-sm border-0"
            disabled={page <= 1}
            asChild={page > 1}
          >
            {page > 1 ? (
              <Link href={buildUrl(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
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
                  asChild={pageNum !== page}
                >
                  {pageNum !== page ? (
                    <Link href={buildUrl(pageNum as number)}>{pageNum}</Link>
                  ) : (
                    <span>{pageNum}</span>
                  )}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/80 backdrop-blur-sm border-0"
            disabled={page >= totalPages}
            asChild={page < totalPages}
          >
            {page < totalPages ? (
              <Link href={buildUrl(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/80 backdrop-blur-sm border-0"
            disabled={page >= totalPages}
            asChild={page < totalPages}
          >
            {page < totalPages ? (
              <Link href={buildUrl(totalPages)}>
                <ChevronsRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronsRight className="h-4 w-4" />
              </span>
            )}
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
