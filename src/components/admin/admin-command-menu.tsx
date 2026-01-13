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
import { NAV_GROUPS, DASHBOARD_ITEM } from "./admin-nav-config";
import {
  Search,
  User,
  Users2,
  Gift,
  Package,
  BookOpen,
  Loader2,
  Crown,
  Shield,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebouncedCallback } from "use-debounce";

// Custom event for opening the command menu
const OPEN_COMMAND_MENU_EVENT = "admin-command-menu-open";

interface SearchResult {
  type: "user" | "bubble" | "wishlist" | "item" | "gift-guide";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  meta?: Record<string, string | number | boolean>;
}

const typeIcons = {
  user: User,
  bubble: Users2,
  wishlist: Gift,
  item: Package,
  "gift-guide": BookOpen,
};

const typeLabels = {
  user: "Users",
  bubble: "Bubbles",
  wishlist: "Wishlists",
  item: "Items",
  "gift-guide": "Gift Guides",
};

/**
 * Trigger button for the command menu.
 * Can be placed multiple times - all triggers open the same dialog.
 */
export function AdminCommandMenuTrigger() {
  const t = useTranslations("admin.nav");

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_MENU_EVENT));
  };

  return (
    <Button
      variant="outline"
      className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
      onClick={handleClick}
    >
      <Search className="h-4 w-4 xl:mr-2" />
      <span className="hidden xl:inline-flex">{t("search")}</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}

/**
 * The command menu dialog.
 * Should only be rendered once in the layout.
 */
export function AdminCommandMenuDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.nav");

  // Debounced search function
  const searchDebounced = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  // Handle query changes
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.length >= 2) {
        setIsSearching(true);
        searchDebounced(value);
      } else {
        setResults([]);
        setIsSearching(false);
      }
    },
    [searchDebounced]
  );

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setIsSearching(false);
    }
  }, [open]);

  useEffect(() => {
    // Listen for keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    // Listen for custom open event from triggers
    const handleOpenEvent = () => {
      setOpen(true);
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_COMMAND_MENU_EVENT, handleOpenEvent);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_MENU_EVENT, handleOpenEvent);
    };
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    // Small delay to let the dialog close animation start before navigation
    requestAnimationFrame(() => {
      command();
    });
  }, []);

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  const hasResults = results.length > 0;
  const showNavigation = !query || query.length < 2;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title={t("search")} shouldFilter={false}>
      <CommandInput
        placeholder={t("searchPlaceholder")}
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        {/* Loading state */}
        {isSearching && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </div>
        )}

        {/* Search results */}
        {!isSearching && hasResults && (
          <>
            {Object.entries(groupedResults).map(([type, items]) => {
              const Icon = typeIcons[type as keyof typeof typeIcons];
              const label = typeLabels[type as keyof typeof typeLabels];

              return (
                <CommandGroup key={type} heading={label}>
                  {items.map((result) => (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      onSelect={() =>
                        runCommand(() => router.push(result.url))
                      }
                      className="flex items-center gap-3"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {result.title}
                          </span>
                          {result.meta?.isAdmin && (
                            <Shield className="h-3 w-3 text-red-500" />
                          )}
                          {result.meta?.tier === "PLUS" && (
                            <Crown className="h-3 w-3 text-amber-500" />
                          )}
                          {result.meta?.archived && (
                            <Archive className="h-3 w-3 text-muted-foreground" />
                          )}
                          {result.meta?.isDefault && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4 px-1"
                            >
                              Default
                            </Badge>
                          )}
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}

        {/* Empty state for search */}
        {!isSearching && query.length >= 2 && !hasResults && (
          <CommandEmpty>{t("noResults")}</CommandEmpty>
        )}

        {/* Navigation - show when not searching */}
        {showNavigation && !isSearching && (
          <>
            {/* Dashboard */}
            <CommandGroup heading={t("dashboard")}>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(DASHBOARD_ITEM.href))
                }
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
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Combined component for backwards compatibility.
 * Renders both trigger and dialog - use only once.
 * @deprecated Use AdminCommandMenuTrigger + AdminCommandMenuDialog separately
 */
export function AdminCommandMenu() {
  return (
    <>
      <AdminCommandMenuTrigger />
      <AdminCommandMenuDialog />
    </>
  );
}
