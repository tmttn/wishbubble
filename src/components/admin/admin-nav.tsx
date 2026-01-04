"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Users2,
  Gift,
  ShoppingCart,
  Activity,
  ArrowLeft,
  Mail,
  Euro,
  Ticket,
  Bell,
  Package,
  Sparkles,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/groups", labelKey: "groups", icon: Users2 },
  { href: "/admin/items", labelKey: "items", icon: Gift },
  { href: "/admin/claims", labelKey: "claims", icon: ShoppingCart },
  { href: "/admin/financials", labelKey: "financials", icon: Euro },
  { href: "/admin/coupons", labelKey: "coupons", icon: Ticket },
  { href: "/admin/product-feeds", labelKey: "productFeeds", icon: Package },
  { href: "/admin/gift-guides", labelKey: "giftGuides", icon: BookOpen },
  { href: "/admin/contact", labelKey: "contact", icon: Mail },
  { href: "/admin/announcements", labelKey: "announcements", icon: Sparkles },
  { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
  { href: "/admin/activity", labelKey: "activity", icon: Activity },
];

const STORAGE_KEY = "admin-nav-collapsed";

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

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
          "h-full border-r bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out flex flex-col flex-shrink-0",
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
        <nav className={cn("space-y-1 flex-1", isCollapsed && "space-y-2")}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
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
                key={item.href}
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
          })}
        </nav>

        {/* Collapse toggle */}
        <div className={cn("mt-6 pt-4 border-t", isCollapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "sm"}
                onClick={toggleCollapsed}
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
