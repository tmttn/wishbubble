"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Clock, ChevronDown, ChevronUp, Users2, Gift } from "lucide-react";
import { UserDetailPanel } from "./user-detail-panel";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
  subscriptionTier: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: { bubbleMemberships: number; wishlists: number };
}

interface UsersListClientProps {
  users: User[];
  labels: {
    noName: string;
    groups: string;
    wishlists: string;
    lastLogin: string;
    neverLoggedIn: string;
  };
}

export function UsersListClient({ users, labels }: UsersListClientProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const handleUserClick = (userId: string, e: React.MouseEvent) => {
    // Allow Ctrl/Cmd+click to open in new tab
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    e.preventDefault();
    setSelectedUserId(userId);
    setPanelOpen(true);
  };

  const handleNavigateToBubble = (bubbleId: string) => {
    // Close user panel and navigate to bubble detail page
    setPanelOpen(false);
    window.location.href = `/admin/groups/${bubbleId}`;
  };

  const handleNavigateToWishlist = (wishlistId: string) => {
    // Close user panel and navigate to wishlist detail page
    setPanelOpen(false);
    window.location.href = `/admin/wishlists/${wishlistId}`;
  };

  const toggleExpanded = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  return (
    <>
      <div className="grid gap-3">
        {users.map((user, index) => {
          const isExpanded = expandedUsers.has(user.id);
          return (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              onClick={(e) => handleUserClick(user.id, e)}
            >
              <Card
                className="border-0 bg-card/80 backdrop-blur-sm hover:bg-card/95 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-background group-hover:ring-primary/20 transition-all">
                        <AvatarImage
                          src={user.image || user.avatarUrl || undefined}
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                          {user.name?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      {user.isAdmin && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {user.name || labels.noName}
                        </p>
                        {user.isAdmin && (
                          <Badge variant="destructive" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {/* Desktop: show stats inline */}
                    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">
                          {user._count.bubbleMemberships}
                        </p>
                        <p className="text-xs">{labels.groups}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">
                          {user._count.wishlists}
                        </p>
                        <p className="text-xs">{labels.wishlists}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          user.subscriptionTier === "PLUS"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : user.subscriptionTier === "COMPLETE"
                              ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                              : ""
                        }
                      >
                        {user.subscriptionTier}
                      </Badge>
                      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {user.lastLoginAt
                          ? `${labels.lastLogin.replace("{date}", user.lastLoginAt.toLocaleDateString())}`
                          : labels.neverLoggedIn}
                      </div>
                    </div>
                    {/* Mobile: expand toggle */}
                    <button
                      onClick={(e) => toggleExpanded(user.id, e)}
                      className="md:hidden flex items-center justify-center h-11 w-11 -mr-2 rounded-lg hover:bg-muted/50 transition-colors"
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {/* Mobile expanded details */}
                  {isExpanded && (
                    <div className="md:hidden mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                          <Users2 className="h-3.5 w-3.5" />
                          <span className="text-xs">{labels.groups}</span>
                        </div>
                        <p className="font-semibold">{user._count.bubbleMemberships}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                          <Gift className="h-3.5 w-3.5" />
                          <span className="text-xs">{labels.wishlists}</span>
                        </div>
                        <p className="font-semibold">{user._count.wishlists}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs">{labels.lastLogin.split(" ")[0]}</span>
                        </div>
                        <p className="font-semibold text-sm">
                          {user.lastLoginAt
                            ? user.lastLoginAt.toLocaleDateString()
                            : labels.neverLoggedIn}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <UserDetailPanel
        userId={selectedUserId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onNavigateToBubble={handleNavigateToBubble}
        onNavigateToWishlist={handleNavigateToWishlist}
      />
    </>
  );
}
