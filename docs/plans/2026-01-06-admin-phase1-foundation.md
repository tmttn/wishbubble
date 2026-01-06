# Admin Command Center Phase 1: Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the flat 16-item admin navigation into grouped collapsible sections with mobile hamburger menu and global search (⌘K).

**Architecture:** Extend existing `AdminNav` component to support collapsible groups. Add a new `AdminMobileNav` component using Sheet for mobile. Create `AdminCommandMenu` using cmdk for global search. Wrap admin layout with CommandMenu provider.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui (Sheet), cmdk, next-intl, Lucide icons

---

## Task 1: Install cmdk Package

**Files:**
- Modify: `package.json`

**Step 1: Install cmdk**

Run:
```bash
npm install cmdk
```

**Step 2: Verify installation**

Run: `npm ls cmdk`
Expected: `cmdk@1.x.x` listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install cmdk for command menu"
```

---

## Task 2: Add Command Component (shadcn pattern)

**Files:**
- Create: `src/components/ui/command.tsx`

**Step 1: Create the command component**

```tsx
"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[300px] overflow-y-auto overflow-x-hidden",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
}
```

**Step 2: Verify file created**

Run: `ls src/components/ui/command.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/ui/command.tsx
git commit -m "feat(ui): add command component for global search"
```

---

## Task 3: Add Translation Keys for Grouped Navigation

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/nl.json`

**Step 1: Add English translations**

Add to `admin.nav` section in `messages/en.json`:

```json
{
  "admin": {
    "nav": {
      "backToApp": "Back to App",
      "adminPanel": "Admin Panel",
      "dashboard": "Dashboard",
      "users": "Users",
      "groups": "Bubbles",
      "wishlists": "Wishlists",
      "items": "Items",
      "claims": "Claims",
      "financials": "Financials",
      "coupons": "Coupons",
      "productFeeds": "Product Feeds",
      "giftGuides": "Gift Guides",
      "contact": "Contact",
      "announcements": "Announcements",
      "notifications": "Notifications",
      "activity": "Activity",
      "analytics": "Analytics",
      "emailQueue": "Email Queue",
      "collapse": "Collapse",
      "expand": "Expand",
      "groups_insights": "Insights",
      "groups_users": "Users & Data",
      "groups_business": "Business",
      "groups_content": "Content",
      "groups_system": "System",
      "search": "Search...",
      "searchPlaceholder": "Search users, bubbles, items...",
      "searchShortcut": "⌘K",
      "noResults": "No results found."
    }
  }
}
```

**Step 2: Add Dutch translations**

Add to `admin.nav` section in `messages/nl.json`:

```json
{
  "admin": {
    "nav": {
      "groups_insights": "Inzichten",
      "groups_users": "Gebruikers & Data",
      "groups_business": "Business",
      "groups_content": "Content",
      "groups_system": "Systeem",
      "search": "Zoeken...",
      "searchPlaceholder": "Zoek gebruikers, bubbles, items...",
      "searchShortcut": "⌘K",
      "noResults": "Geen resultaten gevonden."
    }
  }
}
```

**Step 3: Commit**

```bash
git add messages/en.json messages/nl.json
git commit -m "i18n: add translation keys for grouped navigation"
```

---

## Task 4: Create Grouped Navigation Data Structure

**Files:**
- Create: `src/components/admin/admin-nav-config.ts`

**Step 1: Create navigation config**

```ts
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
```

**Step 2: Verify file created**

Run: `ls src/components/admin/admin-nav-config.ts`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/admin/admin-nav-config.ts
git commit -m "feat(admin): add grouped navigation config"
```

---

## Task 5: Refactor AdminNav to Support Collapsible Groups

**Files:**
- Modify: `src/components/admin/admin-nav.tsx`

**Step 1: Replace the existing admin-nav.tsx**

```tsx
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
```

**Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds (or only pre-existing errors)

**Step 3: Commit**

```bash
git add src/components/admin/admin-nav.tsx
git commit -m "feat(admin): refactor nav to collapsible groups"
```

---

## Task 6: Create Mobile Navigation Component

**Files:**
- Create: `src/components/admin/admin-mobile-nav.tsx`

**Step 1: Create the mobile nav component**

```tsx
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

      {/* Placeholder for search button - will be added in global search task */}
      <div className="w-10" />
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
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
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
```

**Step 2: Verify file created**

Run: `ls src/components/admin/admin-mobile-nav.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/admin/admin-mobile-nav.tsx
git commit -m "feat(admin): add mobile navigation with sheet"
```

---

## Task 7: Create Admin Command Menu (Global Search)

**Files:**
- Create: `src/components/admin/admin-command-menu.tsx`

**Step 1: Create the command menu component**

```tsx
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
    command();
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
      <CommandDialog open={open} onOpenChange={setOpen}>
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
```

**Step 2: Verify file created**

Run: `ls src/components/admin/admin-command-menu.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/admin/admin-command-menu.tsx
git commit -m "feat(admin): add command menu for global search (⌘K)"
```

---

## Task 8: Update Admin Layout to Include Mobile Nav and Command Menu

**Files:**
- Modify: `src/app/(admin)/layout.tsx`

**Step 1: Update the admin layout**

```tsx
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminCommandMenu } from "@/components/admin/admin-command-menu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="fixed inset-0 top-0 z-50 bg-background bg-gradient-mesh">
      {/* Mobile header */}
      <AdminMobileNav />

      <div className="flex h-[calc(100%-56px)] md:h-full">
        {/* Desktop sidebar */}
        <AdminNav />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop header with search */}
          <header className="hidden md:flex items-center justify-end h-14 px-6 border-b bg-card/30 backdrop-blur-sm">
            <AdminCommandMenu />
          </header>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/\(admin\)/layout.tsx
git commit -m "feat(admin): integrate mobile nav and command menu in layout"
```

---

## Task 9: Add Search Button to Mobile Nav Header

**Files:**
- Modify: `src/components/admin/admin-mobile-nav.tsx`

**Step 1: Update mobile nav to include search trigger**

Import AdminCommandMenu and replace the placeholder div:

In the component, update the return statement to include the search button:

```tsx
// Add import at top
import { AdminCommandMenu } from "./admin-command-menu";

// In the return, replace:
// <div className="w-10" />
// With:
<AdminCommandMenu />
```

**Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/admin/admin-mobile-nav.tsx
git commit -m "feat(admin): add search button to mobile nav"
```

---

## Task 10: Manual Testing Checklist

**Verify the following manually:**

Desktop:
- [ ] Sidebar shows grouped navigation with collapsible sections
- [ ] Clicking group header expands/collapses the section
- [ ] Collapsed state persists on page refresh
- [ ] Current page's group auto-expands on navigation
- [ ] Sidebar collapse button works (icon-only mode)
- [ ] ⌘K opens command menu
- [ ] Command menu search filters navigation items
- [ ] Selecting item navigates to page

Mobile (resize browser or use devtools):
- [ ] Hamburger menu visible on mobile
- [ ] Tapping hamburger opens sheet with navigation
- [ ] Groups are collapsible in mobile sheet
- [ ] Search button visible in mobile header
- [ ] ⌘K still works on mobile
- [ ] Navigation closes sheet after selecting item

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test in browser**

Visit: `http://localhost:3000/admin`

**Step 3: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix(admin): address issues from manual testing"
```

---

## Summary

Phase 1 delivers:
- Grouped collapsible navigation (5 groups)
- Mobile-responsive hamburger menu
- Global search with ⌘K shortcut
- Persisted navigation state

Next phase (Phase 2) will focus on the Smart Dashboard redesign.
