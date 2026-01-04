"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSortHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}

export function AdminSortHeader({
  label,
  sortKey,
  currentSort,
  currentOrder = "desc",
  baseUrl,
  searchParams = {},
  className,
}: AdminSortHeaderProps) {
  const isActive = currentSort === sortKey;
  const nextOrder = isActive && currentOrder === "desc" ? "asc" : "desc";

  const buildUrl = () => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && key !== "sort" && key !== "order" && key !== "page") {
        params.set(key, value);
      }
    });
    params.set("sort", sortKey);
    params.set("order", nextOrder);
    // Reset to page 1 when sorting changes
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  return (
    <Link
      href={buildUrl()}
      className={cn(
        "flex items-center gap-1 hover:text-foreground transition-colors group",
        isActive ? "text-foreground font-medium" : "text-muted-foreground",
        className
      )}
    >
      {label}
      <span className="flex-shrink-0">
        {isActive ? (
          currentOrder === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </Link>
  );
}
