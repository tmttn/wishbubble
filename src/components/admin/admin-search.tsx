"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdminSearchProps {
  placeholder?: string;
  defaultValue?: string;
  paramName?: string;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}

export function AdminSearch({
  placeholder,
  defaultValue = "",
  paramName = "q",
  baseUrl,
  searchParams = {},
  className,
}: AdminSearchProps) {
  const t = useTranslations("admin.common");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get(paramName) as string;

    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && key !== paramName && key !== "page") {
        params.set(key, value);
      }
    });
    if (query) {
      params.set(paramName, query);
    }
    const queryString = params.toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    startTransition(() => {
      router.push(url);
    });
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && key !== paramName && key !== "page") {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex-1 max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        name={paramName}
        placeholder={placeholder || t("searchPlaceholder")}
        defaultValue={defaultValue}
        className="pl-10 pr-20 bg-card/80 backdrop-blur-sm border-0"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {defaultValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("search")}
        </Button>
      </div>
    </form>
  );
}
