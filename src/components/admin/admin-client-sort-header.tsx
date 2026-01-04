"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminClientSortHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  onSort: (key: string, order: "asc" | "desc") => void;
  className?: string;
}

export function AdminClientSortHeader({
  label,
  sortKey,
  currentSort,
  currentOrder = "desc",
  onSort,
  className,
}: AdminClientSortHeaderProps) {
  const isActive = currentSort === sortKey;
  const nextOrder = isActive && currentOrder === "desc" ? "asc" : "desc";

  return (
    <button
      onClick={() => onSort(sortKey, nextOrder)}
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
    </button>
  );
}
