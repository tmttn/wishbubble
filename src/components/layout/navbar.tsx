"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import { Gift, Menu, User, Settings, LogOut, Plus, Sparkles, Home, Users, Shield, Bell, BookOpen, Calendar, History } from "lucide-react";
import { TierBadge } from "@/components/ui/tier-badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle, ThemeToggleMobile } from "@/components/ui/theme-toggle";
import { LanguageToggle, LanguageToggleMobile } from "@/components/layout/language-toggle";

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const t = useTranslations("nav");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/admin/check")
        .then((res) => res.json())
        .then((data) => setIsAdmin(data.isAdmin))
        .catch(() => setIsAdmin(false));

      fetch("/api/user/tier")
        .then((res) => res.json())
        .then((data) => {
          setIsPremium(data.tier !== "BASIC");
          setIsComplete(data.tier === "COMPLETE");
        })
        .catch(() => {
          setIsPremium(false);
          setIsComplete(false);
        });
    }
  }, [session]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { href: "/dashboard", label: t("dashboard"), icon: Home },
    { href: "/bubbles", label: t("bubbles"), icon: Users },
    { href: "/wishlist", label: t("wishlist"), icon: Gift },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 sm:px-6 flex h-16 items-center justify-between">
        {/* Logo and nav */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              WishBubble
            </span>
          </Link>

          {session && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <>
              {/* New Bubble button - desktop */}
              <Button asChild className="hidden md:inline-flex rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 group" size="sm">
                <Link href="/bubbles/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t("newBubble")}
                  <Sparkles className="h-3.5 w-3.5 ml-1.5 transition-colors group-hover:text-yellow-200" />
                </Link>
              </Button>

              {/* Language toggle */}
              <LanguageToggle />

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Notification bell */}
              <NotificationBell />

              {/* User dropdown - desktop only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all hidden md:inline-flex"
                  >
                    <PremiumAvatar
                      src={session.user?.image}
                      fallback={getInitials(session.user?.name)}
                      isPremium={isPremium}
                      size="md"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl p-2">
                  <div className="flex items-center gap-3 p-3 mb-1">
                    <PremiumAvatar
                      src={session.user?.image}
                      fallback={getInitials(session.user?.name)}
                      isPremium={isPremium}
                      size="md"
                    />
                    <div className="flex flex-col min-w-0">
                      {session.user?.name && (
                        <p className="font-medium truncate">{session.user.name}</p>
                      )}
                      {session.user?.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      {t("dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/wishlist">
                      <Gift className="mr-2 h-4 w-4" />
                      {t("wishlist")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href={isComplete ? "/gift-history" : "/pricing"} className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <History className="mr-2 h-4 w-4" />
                        {t("giftHistory")}
                      </span>
                      {!isComplete && <TierBadge tier="COMPLETE" size="sm" />}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onSelect={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0">
                  <SheetHeader className="p-6 pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
                        <Gift className="h-4 w-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold font-display">
                        WishBubble
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  {/* User info */}
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                      <PremiumAvatar
                        src={session.user?.image}
                        fallback={getInitials(session.user?.name)}
                        isPremium={isPremium}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{session.user?.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{session.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation links */}
                  <nav className="flex flex-col gap-1 p-4">
                    {navLinks.map((link) => (
                      <SheetClose key={link.href} asChild>
                        <Link
                          href={link.href}
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                        >
                          <link.icon className="h-5 w-5 text-muted-foreground" />
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Link
                        href="/bubbles/new"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 transition-colors mt-2"
                      >
                        <Plus className="h-5 w-5" />
                        {t("createBubble")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/notifications"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                      >
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        {t("notifications")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href={isComplete ? "/gift-history" : "/pricing"}
                        className="flex items-center justify-between px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <History className="h-5 w-5 text-muted-foreground" />
                          {t("giftHistory")}
                        </span>
                        {!isComplete && <TierBadge tier="COMPLETE" size="sm" />}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                      >
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        {t("settings")}
                      </Link>
                    </SheetClose>
                    {isAdmin && (
                      <SheetClose asChild>
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                        >
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          Admin Panel
                        </Link>
                      </SheetClose>
                    )}
                    <LanguageToggleMobile />
                    <ThemeToggleMobile />
                  </nav>

                  {/* Sign out */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      {t("logout")}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="ghost" className="rounded-xl hidden lg:inline-flex" asChild>
                <Link href="/occasions">{t("occasions")}</Link>
              </Button>
              <Button variant="ghost" className="rounded-xl hidden lg:inline-flex" asChild>
                <Link href="/gift-guides">{t("giftGuides")}</Link>
              </Button>
              <Button variant="ghost" className="rounded-xl hidden sm:inline-flex" asChild>
                <Link href="/pricing">{t("pricing")}</Link>
              </Button>
              <Button variant="ghost" className="rounded-xl hidden sm:inline-flex" asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20" asChild>
                <Link href="/register">{t("register")}</Link>
              </Button>

              {/* Mobile menu for logged-out users */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl sm:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0">
                  <SheetHeader className="p-6 pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
                        <Gift className="h-4 w-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold font-display">
                        WishBubble
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="flex flex-col gap-1 p-4">
                    <SheetClose asChild>
                      <Link
                        href="/occasions"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                      >
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        {t("occasions")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/gift-guides"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                      >
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        {t("giftGuides")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/pricing"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                      >
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                        {t("pricing")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors"
                      >
                        <User className="h-5 w-5 text-muted-foreground" />
                        {t("login")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/register"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 transition-colors mt-2"
                      >
                        <Plus className="h-5 w-5" />
                        {t("register")}
                      </Link>
                    </SheetClose>
                    <LanguageToggleMobile />
                    <ThemeToggleMobile />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
