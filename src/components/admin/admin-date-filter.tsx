"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdminDateFilterProps {
  fromDate?: string;
  toDate?: string;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  fromParamName?: string;
  toParamName?: string;
}

export function AdminDateFilter({
  fromDate,
  toDate,
  baseUrl,
  searchParams = {},
  fromParamName = "from",
  toParamName = "to",
}: AdminDateFilterProps) {
  const t = useTranslations("admin.common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const buildUrl = (newFromDate?: string, newToDate?: string) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== "" &&
        key !== fromParamName &&
        key !== toParamName &&
        key !== "page"
      ) {
        params.set(key, value);
      }
    });
    if (newFromDate) {
      params.set(fromParamName, newFromDate);
    }
    if (newToDate) {
      params.set(toParamName, newToDate);
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFromDate = formData.get(fromParamName) as string;
    const newToDate = formData.get(toParamName) as string;

    startTransition(() => {
      router.push(buildUrl(newFromDate, newToDate));
    });
  };

  const handleClear = () => {
    startTransition(() => {
      router.push(buildUrl());
    });
  };

  const hasDateFilter = fromDate || toDate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={hasDateFilter ? "default" : "outline"}
          size="sm"
          className={`gap-2 ${!hasDateFilter ? "bg-card/80 backdrop-blur-sm border-0" : ""}`}
        >
          <CalendarDays className="h-4 w-4" />
          {hasDateFilter ? (
            <>
              {fromDate || "..."} - {toDate || "..."}
            </>
          ) : (
            t("dateRange")
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form onSubmit={handleApply} className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{t("filterByDate")}</h4>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={fromParamName}>{t("from")}</Label>
              <Input
                id={fromParamName}
                name={fromParamName}
                type="date"
                defaultValue={fromDate}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={toParamName}>{t("to")}</Label>
              <Input
                id={toParamName}
                name={toParamName}
                type="date"
                defaultValue={toDate}
              />
            </div>
          </div>
          <div className="flex justify-between">
            {hasDateFilter && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isPending}
              >
                <X className="h-3 w-3 mr-1" />
                {t("clear")}
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isPending} className="ml-auto">
              {t("apply")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
