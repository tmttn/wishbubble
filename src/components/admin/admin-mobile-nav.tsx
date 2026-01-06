"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ArrowLeft, Menu, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NAV_GROUPS,
  DASHBOARD_ITEM,
  NAV_COLLAPSED_GROUPS_KEY,
  NavItem,
  NavGroup,
} from "./admin-nav-config";
import { AdminCommandMenuTrigger } from "./admin-command-menu";
import { ImpersonateDropdown } from "./impersonate-dropdown";
import { SimulateEventsDropdown } from "./simulate-events-dropdown";

type CollapsedGroups = Record<string, boolean>;

export function AdminMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<CollapsedGroups>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedGroups = localStorage.getItem(NAV_COLLAPSED_GROUPS_KEY);
    if (storedGroups) {
      try {
        setCollapsedGroups(JSON.parse(storedGroups));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Close sheet on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleGroup = (groupKey: string) => {
    const newGroups = {
      ...collapsedGroups,
      [groupKey]: !collapsedGroups[groupKey],
    };
    setCollapsedGroups(newGroups);
    localStorage.setItem(NAV_COLLAPSED_GROUPS_KEY, JSON.stringify(newGroups));
  };

  const isItemActive = (item: NavItem) =>
    pathname === item.href ||
    (item.href !== "/admin" && pathname.startsWith(item.href));

  if (!mounted) {
    return (
      <div className="md:hidden flex items-center h-14 px-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-card/50 backdrop-blur-sm">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("adminPanel")}
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col h-[calc(100%-65px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {/* Dashboard */}
              <MobileNavItem
                item={DASHBOARD_ITEM}
                isActive={pathname === DASHBOARD_ITEM.href}
                t={t}
              />

              {/* Grouped items */}
              {NAV_GROUPS.map((group) => (
                <MobileNavGroup
                  key={group.labelKey}
                  group={group}
                  isGroupCollapsed={collapsedGroups[group.labelKey] ?? false}
                  onToggleGroup={() => toggleGroup(group.labelKey)}
                  isItemActive={isItemActive}
                  t={t}
                />
              ))}
            </div>

            {/* Quick Actions (mobile) */}
            <div className="p-4 border-t">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-2">
                <ImpersonateDropdown />
                <SimulateEventsDropdown />
              </div>
            </div>

            {/* Back to app */}
            <div className="p-4 border-t">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("backToApp")}
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="font-semibold text-sm truncate">
        {t("adminPanel")}
      </h1>

      <AdminCommandMenuTrigger />
    </div>
  );
}

function MobileNavItem({
  item,
  isActive,
  t,
}: {
  item: NavItem;
  isActive: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
      {t(item.labelKey)}
    </Link>
  );
}

function MobileNavGroup({
  group,
  isGroupCollapsed,
  onToggleGroup,
  isItemActive,
  t,
}: {
  group: NavGroup;
  isGroupCollapsed: boolean;
  onToggleGroup: () => void;
  isItemActive: (item: NavItem) => boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const hasActiveItem = group.items.some(isItemActive);

  return (
    <div className="pt-3">
      <button
        onClick={onToggleGroup}
        className={cn(
          "flex items-center justify-between w-full px-3 min-h-[44px] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors",
          hasActiveItem
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
        )}
      >
        <span>{t(group.labelKey)}</span>
        {isGroupCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {!isGroupCollapsed && (
        <div className="mt-1 space-y-1 ml-2">
          {group.items.map((item) => (
            <MobileNavItem
              key={item.href}
              item={item}
              isActive={isItemActive(item)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
