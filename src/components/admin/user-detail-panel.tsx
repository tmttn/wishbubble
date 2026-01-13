"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DetailPanel,
  DetailPanelContent,
  DetailPanelHeader,
  DetailPanelTitle,
  DetailPanelDescription,
  DetailPanelBody,
  DetailPanelFooter,
  DetailPanelSection,
  DetailPanelCard,
  DetailPanelStat,
  DetailPanelAlert,
} from "./detail-panel";
import { UserActions } from "./user-actions";
import {
  Mail,
  Calendar,
  Clock,
  Users2,
  Gift,
  ShoppingCart,
  ExternalLink,
  AlertTriangle,
  Archive,
  Shield,
  Crown,
} from "lucide-react";

interface UserPanelData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  avatarUrl: string | null;
  subscriptionTier: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerified: string | null;
  suspendedAt: string | null;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  bubbleMemberships: Array<{
    role: string;
    bubble: {
      id: string;
      name: string;
      occasionType: string;
      archivedAt: string | null;
      _count: { members: number };
    };
  }>;
  wishlists: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    _count: { items: number };
  }>;
  claims: Array<{
    id: string;
    status: string;
    claimedAt: string;
    item: { id: string; title: string };
    bubble: { id: string; name: string };
  }>;
  ownedBubblesCount: number;
}

interface UserDetailPanelProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToBubble?: (bubbleId: string) => void;
  onNavigateToWishlist?: (wishlistId: string) => void;
}

const tierColors: Record<string, string> = {
  BASIC: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
  PLUS: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  COMPLETE: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
};

export function UserDetailPanel({
  userId,
  open,
  onOpenChange,
  onNavigateToBubble,
  onNavigateToWishlist,
}: UserDetailPanelProps) {
  const [user, setUser] = useState<UserPanelData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !open) {
      setUser(null);
      setError(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/panel`);
        if (!res.ok) {
          throw new Error("Failed to load user");
        }
        const data = await res.json();
        startTransition(() => {
          setUser(data);
          setError(null);
        });
      } catch {
        startTransition(() => {
          setError("Failed to load user details");
          setUser(null);
        });
      }
    };

    fetchUser();
  }, [userId, open]);

  const loading = isPending || (!user && !error && open && userId);

  return (
    <DetailPanel open={open} onOpenChange={onOpenChange}>
      <DetailPanelContent>
        {loading && <UserPanelSkeleton />}

        {error && (
          <div className="flex items-center justify-center h-40 p-6">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {user && (
          <>
            <DetailPanelHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-border shadow-md">
                  <AvatarImage src={user.image || user.avatarUrl || undefined} />
                  <AvatarFallback className="text-xl font-semibold bg-muted text-muted-foreground">
                    {user.name?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <DetailPanelTitle className="flex items-center gap-2 flex-wrap">
                    <span className="truncate">{user.name || "No name"}</span>
                  </DetailPanelTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={tierColors[user.subscriptionTier] || tierColors.BASIC}
                    >
                      {user.subscriptionTier === "PLUS" && <Crown className="h-3 w-3 mr-1" />}
                      {user.subscriptionTier}
                    </Badge>
                    {user.isAdmin && (
                      <Badge variant="destructive" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <DetailPanelDescription className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </DetailPanelDescription>
                </div>
              </div>
            </DetailPanelHeader>

            <DetailPanelBody className="space-y-6">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3">
                <DetailPanelStat
                  label="Joined"
                  value={new Date(user.createdAt).toLocaleDateString()}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DetailPanelStat
                  label="Last login"
                  value={user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              {/* Suspension Warning */}
              {user.suspendedAt && (
                <DetailPanelAlert variant="warning" icon={<AlertTriangle className="h-4 w-4" />}>
                  <p className="font-medium">Account Suspended</p>
                  {user.suspendedUntil && (
                    <p className="text-muted-foreground">
                      Until {new Date(user.suspendedUntil).toLocaleDateString()}
                    </p>
                  )}
                  {user.suspensionReason && (
                    <p className="text-muted-foreground mt-1">
                      {user.suspensionReason}
                    </p>
                  )}
                </DetailPanelAlert>
              )}

              {/* Groups */}
              <DetailPanelSection
                title="Groups"
                icon={<Users2 className="h-4 w-4" />}
                count={user.bubbleMemberships.length}
              >
                {user.bubbleMemberships.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No groups</p>
                ) : (
                  <div className="space-y-2">
                    {user.bubbleMemberships.slice(0, 5).map((m) => {
                      const isArchived = !!m.bubble.archivedAt;
                      return (
                        <DetailPanelCard
                          key={m.bubble.id}
                          onClick={() => onNavigateToBubble?.(m.bubble.id)}
                          className={isArchived ? "opacity-60" : ""}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium truncate">
                                {m.bubble.name}
                              </span>
                              {isArchived && (
                                <Archive className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {m.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {m.bubble._count.members} members · {m.bubble.occasionType}
                          </p>
                        </DetailPanelCard>
                      );
                    })}
                    {user.bubbleMemberships.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{user.bubbleMemberships.length - 5} more groups
                      </p>
                    )}
                  </div>
                )}
              </DetailPanelSection>

              {/* Wishlists */}
              <DetailPanelSection
                title="Wishlists"
                icon={<Gift className="h-4 w-4" />}
                count={user.wishlists.length}
              >
                {user.wishlists.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No wishlists</p>
                ) : (
                  <div className="space-y-2">
                    {user.wishlists.slice(0, 4).map((w) => (
                      <DetailPanelCard
                        key={w.id}
                        onClick={() => onNavigateToWishlist?.(w.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{w.name}</span>
                          {w.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {w._count.items} items
                        </p>
                      </DetailPanelCard>
                    ))}
                    {user.wishlists.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{user.wishlists.length - 4} more wishlists
                      </p>
                    )}
                  </div>
                )}
              </DetailPanelSection>

              {/* Recent Claims */}
              <DetailPanelSection
                title="Recent Claims"
                icon={<ShoppingCart className="h-4 w-4" />}
                count={user.claims.length}
              >
                {user.claims.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No claims</p>
                ) : (
                  <div className="space-y-2">
                    {user.claims.slice(0, 3).map((c) => (
                      <DetailPanelCard key={c.id}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {c.item.title}
                          </span>
                          <Badge
                            variant={c.status === "PURCHASED" ? "default" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          in {c.bubble.name} · {new Date(c.claimedAt).toLocaleDateString()}
                        </p>
                      </DetailPanelCard>
                    ))}
                  </div>
                )}
              </DetailPanelSection>

              {/* Admin Actions */}
              {!user.isAdmin && (
                <DetailPanelSection title="Admin Actions">
                  <UserActions
                    userId={user.id}
                    userEmail={user.email}
                    userName={user.name}
                    isAdmin={user.isAdmin}
                    isSuspended={!!user.suspendedAt}
                    suspendedUntil={user.suspendedUntil ? new Date(user.suspendedUntil) : null}
                    suspensionReason={user.suspensionReason}
                    ownedBubblesCount={user.ownedBubblesCount}
                    subscriptionTier={user.subscriptionTier}
                  />
                </DetailPanelSection>
              )}
            </DetailPanelBody>

            <DetailPanelFooter>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/admin/users/${user.id}`}>
                  <ExternalLink className="h-4 w-4" />
                  View Full Profile
                </Link>
              </Button>
            </DetailPanelFooter>
          </>
        )}
      </DetailPanelContent>
    </DetailPanel>
  );
}

function UserPanelSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
