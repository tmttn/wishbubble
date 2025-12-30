"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Menu, User, Settings, LogOut, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const t = useTranslations("nav");

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              WishBubble
            </span>
          </Link>

          {session && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("dashboard")}
              </Link>
              <Link
                href="/bubbles"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("bubbles")}
              </Link>
              <Link
                href="/wishlist"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("wishlist")}
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <>
              <Button asChild className="hidden md:inline-flex" size="sm">
                <Link href="/bubbles/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Bubble
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={session.user?.image || undefined}
                        alt={session.user?.name || "User"}
                      />
                      <AvatarFallback>
                        {getInitials(session.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user?.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      {session.user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t("dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer">
                      <Gift className="mr-2 h-4 w-4" />
                      {t("wishlist")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onSelect={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link
                      href="/dashboard"
                      className="text-lg font-medium hover:text-primary"
                    >
                      {t("dashboard")}
                    </Link>
                    <Link
                      href="/bubbles"
                      className="text-lg font-medium hover:text-primary"
                    >
                      {t("bubbles")}
                    </Link>
                    <Link
                      href="/wishlist"
                      className="text-lg font-medium hover:text-primary"
                    >
                      {t("wishlist")}
                    </Link>
                    <Link
                      href="/bubbles/new"
                      className="text-lg font-medium hover:text-primary"
                    >
                      Create Bubble
                    </Link>
                    <Link
                      href="/settings"
                      className="text-lg font-medium hover:text-primary"
                    >
                      {t("settings")}
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t("register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
