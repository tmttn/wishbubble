"use client";

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
} from "lucide-react";
import { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/groups", labelKey: "groups", icon: Users2 },
  { href: "/admin/items", labelKey: "items", icon: Gift },
  { href: "/admin/claims", labelKey: "claims", icon: ShoppingCart },
  { href: "/admin/financials", labelKey: "financials", icon: Euro },
  { href: "/admin/coupons", labelKey: "coupons", icon: Ticket },
  { href: "/admin/product-feeds", labelKey: "productFeeds", icon: Package },
  { href: "/admin/contact", labelKey: "contact", icon: Mail },
  { href: "/admin/announcements", labelKey: "announcements", icon: Sparkles },
  { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
  { href: "/admin/activity", labelKey: "activity", icon: Activity },
];

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  return (
    <aside className="w-64 min-h-screen border-r bg-card/50 backdrop-blur-sm p-6">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToApp")}
        </Link>
      </div>

      <h2 className="text-lg font-bold mb-6">{t("adminPanel")}</h2>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
