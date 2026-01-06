"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  NAV_GROUPS,
  DASHBOARD_ITEM,
} from "./admin-nav-config";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminCommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.nav");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    // Small delay to let the dialog close animation start before navigation
    requestAnimationFrame(() => {
      command();
    });
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">{t("search")}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={t("search")}>
        <CommandInput placeholder={t("searchPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("noResults")}</CommandEmpty>

          {/* Dashboard */}
          <CommandGroup heading={t("dashboard")}>
            <CommandItem
              onSelect={() => runCommand(() => router.push(DASHBOARD_ITEM.href))}
            >
              <DASHBOARD_ITEM.icon className="mr-2 h-4 w-4" />
              {t(DASHBOARD_ITEM.labelKey)}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Navigation Groups */}
          {NAV_GROUPS.map((group) => (
            <CommandGroup key={group.labelKey} heading={t(group.labelKey)}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => runCommand(() => router.push(item.href))}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {t(item.labelKey)}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
