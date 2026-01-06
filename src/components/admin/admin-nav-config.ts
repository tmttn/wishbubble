import {
  LayoutDashboard,
  Users,
  Users2,
  Gift,
  Heart,
  ShoppingCart,
  Activity,
  Mail,
  Euro,
  Ticket,
  Bell,
  Package,
  Sparkles,
  BarChart3,
  BookOpen,
  Inbox,
  Settings,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

export type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "groups_insights",
    items: [
      { href: "/admin/analytics", labelKey: "analytics", icon: BarChart3 },
      { href: "/admin/activity", labelKey: "activity", icon: Activity },
    ],
  },
  {
    labelKey: "groups_users",
    items: [
      { href: "/admin/users", labelKey: "users", icon: Users },
      { href: "/admin/groups", labelKey: "groups", icon: Users2 },
      { href: "/admin/wishlists", labelKey: "wishlists", icon: Heart },
      { href: "/admin/items", labelKey: "items", icon: Gift },
      { href: "/admin/claims", labelKey: "claims", icon: ShoppingCart },
    ],
  },
  {
    labelKey: "groups_business",
    items: [
      { href: "/admin/financials", labelKey: "financials", icon: Euro },
      { href: "/admin/coupons", labelKey: "coupons", icon: Ticket },
    ],
  },
  {
    labelKey: "groups_content",
    items: [
      { href: "/admin/gift-guides", labelKey: "giftGuides", icon: BookOpen },
      { href: "/admin/announcements", labelKey: "announcements", icon: Sparkles },
      { href: "/admin/product-feeds", labelKey: "productFeeds", icon: Package },
    ],
  },
  {
    labelKey: "groups_system",
    items: [
      { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
      { href: "/admin/email-queue", labelKey: "emailQueue", icon: Inbox },
      { href: "/admin/contact", labelKey: "contact", icon: Mail },
      { href: "/admin/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

export const DASHBOARD_ITEM: NavItem = {
  href: "/admin",
  labelKey: "dashboard",
  icon: LayoutDashboard,
};

// Storage key for collapsed groups
export const NAV_COLLAPSED_GROUPS_KEY = "admin-nav-collapsed-groups";
export const NAV_SIDEBAR_COLLAPSED_KEY = "admin-nav-collapsed";
