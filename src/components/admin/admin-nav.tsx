"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  NAV_GROUPS,
  DASHBOARD_ITEM,
  NAV_COLLAPSED_GROUPS_KEY,
  NAV_SIDEBAR_COLLAPSED_KEY,
  NavItem,
  NavGroup,
} from "./admin-nav-config";

type CollapsedGroups = Record<string, boolean>;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<CollapsedGroups>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load sidebar collapsed state
    const storedCollapsed = localStorage.getItem(NAV_SIDEBAR_COLLAPSED_KEY);
    if (storedCollapsed !== null) {
      setIsCollapsed(storedCollapsed === "true");
    }
    // Load group collapsed states
    const storedGroups = localStorage.getItem(NAV_COLLAPSED_GROUPS_KEY);
    if (storedGroups) {
      try {
        setCollapsedGroups(JSON.parse(storedGroups));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Auto-expand group containing current page
  useEffect(() => {
    if (!mounted) return;

    const currentGroup = NAV_GROUPS.find((group) =>
      group.items.some(
        (item) =>
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href))
      )
    );

    if (currentGroup && collapsedGroups[currentGroup.labelKey]) {
      setCollapsedGroups((prev) => ({
        ...prev,
        [currentGroup.labelKey]: false,
      }));
    }
  }, [pathname, mounted]);

  const toggleSidebar = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem(NAV_SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

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

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className="w-64 h-full border-r bg-card/50 backdrop-blur-sm p-6 flex-shrink-0">
        <div className="h-full" />
      </aside>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-full border-r bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 hidden md:flex",
          isCollapsed ? "w-[72px] p-3" : "w-64 p-6"
        )}
      >
        {/* Back to app link */}
        <div className={cn("mb-6", isCollapsed && "flex justify-center")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                {t("backToApp")}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToApp")}
            </Link>
          )}
        </div>

        {/* Title */}
        {!isCollapsed && (
          <h2 className="text-lg font-bold mb-6 font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("adminPanel")}
          </h2>
        )}

        {/* Navigation */}
        <nav className={cn("space-y-1 flex-1 overflow-y-auto", isCollapsed && "space-y-2")}>
          {/* Dashboard - always visible */}
          <NavItemLink
            item={DASHBOARD_ITEM}
            isActive={pathname === DASHBOARD_ITEM.href}
            isCollapsed={isCollapsed}
            t={t}
          />

          {/* Grouped items */}
          {NAV_GROUPS.map((group) => (
            <NavGroupSection
              key={group.labelKey}
              group={group}
              isCollapsed={isCollapsed}
              isGroupCollapsed={collapsedGroups[group.labelKey] ?? false}
              onToggleGroup={() => toggleGroup(group.labelKey)}
              isItemActive={isItemActive}
              t={t}
            />
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className={cn("mt-6 pt-4 border-t", isCollapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "sm"}
                onClick={toggleSidebar}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors",
                  !isCollapsed && "w-full justify-start gap-2"
                )}
              >
                {isCollapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    {t("collapse")}
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={10}>
                {t("expand")}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function NavItemLink({
  item,
  isActive,
  isCollapsed,
  t,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-center w-full h-10 rounded-lg transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {t(item.labelKey)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 transition-transform", isActive && "scale-110")} />
      {t(item.labelKey)}
    </Link>
  );
}

function NavGroupSection({
  group,
  isCollapsed,
  isGroupCollapsed,
  onToggleGroup,
  isItemActive,
  t,
}: {
  group: NavGroup;
  isCollapsed: boolean;
  isGroupCollapsed: boolean;
  onToggleGroup: () => void;
  isItemActive: (item: NavItem) => boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const hasActiveItem = group.items.some(isItemActive);

  if (isCollapsed) {
    // In collapsed mode, show items directly with separator
    return (
      <div className="pt-2 mt-2 border-t border-border/50">
        {group.items.map((item) => (
          <NavItemLink
            key={item.href}
            item={item}
            isActive={isItemActive(item)}
            isCollapsed={true}
            t={t}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-3">
      <button
        onClick={onToggleGroup}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors",
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
        <div className="mt-1 space-y-1">
          {group.items.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              isActive={isItemActive(item)}
              isCollapsed={false}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
