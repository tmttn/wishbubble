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
  DetailPanelAlert,
} from "./detail-panel";
import {
  Calendar,
  Users2,
  Gift,
  ExternalLink,
  Archive,
  Activity,
  Sparkles,
  Eye,
  EyeOff,
  ShoppingCart,
  User,
} from "lucide-react";

interface BubblePanelData {
  id: string;
  name: string;
  occasionType: string;
  eventDate: string | null;
  visibility: string;
  archivedAt: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  members: Array<{
    userId: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      avatarUrl: string | null;
    };
  }>;
  wishlists: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    ownerName: string | null;
    ownerId: string;
    itemCount: number;
  }>;
  hasSecretSanta: boolean;
  counts: {
    members: number;
    wishlists: number;
    claims: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    createdAt: string;
    userName: string | null;
    userId: string | null;
  }>;
}

interface BubbleDetailPanelProps {
  bubbleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToUser?: (userId: string) => void;
  onNavigateToWishlist?: (wishlistId: string) => void;
}

export function BubbleDetailPanel({
  bubbleId,
  open,
  onOpenChange,
  onNavigateToUser,
  onNavigateToWishlist,
}: BubbleDetailPanelProps) {
  const [bubble, setBubble] = useState<BubblePanelData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bubbleId || !open) {
      setBubble(null);
      setError(null);
      return;
    }

    const fetchBubble = async () => {
      try {
        const res = await fetch(`/api/admin/groups/${bubbleId}/panel`);
        if (!res.ok) {
          throw new Error("Failed to load group");
        }
        const data = await res.json();
        startTransition(() => {
          setBubble(data);
          setError(null);
        });
      } catch {
        startTransition(() => {
          setError("Failed to load group details");
          setBubble(null);
        });
      }
    };

    fetchBubble();
  }, [bubbleId, open]);

  const loading = isPending || (!bubble && !error && open && bubbleId);

  const getDaysUntilEvent = (eventDate: string) => {
    const event = new Date(eventDate);
    const now = new Date();
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DetailPanel open={open} onOpenChange={onOpenChange}>
      <DetailPanelContent>
        {loading && <BubblePanelSkeleton />}

        {error && (
          <div className="flex items-center justify-center h-40 p-6">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {bubble && (
          <>
            <DetailPanelHeader>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <DetailPanelTitle>{bubble.name}</DetailPanelTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-primary/5">
                    {bubble.occasionType}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={bubble.visibility === "PUBLIC"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                      : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30"
                    }
                  >
                    {bubble.visibility === "PUBLIC" ? (
                      <Eye className="h-3 w-3 mr-1" />
                    ) : (
                      <EyeOff className="h-3 w-3 mr-1" />
                    )}
                    {bubble.visibility}
                  </Badge>
                  {bubble.archivedAt && (
                    <Badge variant="secondary" className="gap-1">
                      <Archive className="h-3 w-3" />
                      Archived
                    </Badge>
                  )}
                </div>
                {bubble.eventDate && (
                  <DetailPanelDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(bubble.eventDate).toLocaleDateString()}</span>
                    {getDaysUntilEvent(bubble.eventDate) > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                        {getDaysUntilEvent(bubble.eventDate)} days away
                      </Badge>
                    )}
                    {getDaysUntilEvent(bubble.eventDate) <= 0 && getDaysUntilEvent(bubble.eventDate) > -30 && (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        Event passed
                      </Badge>
                    )}
                  </DetailPanelDescription>
                )}
              </div>
            </DetailPanelHeader>

            <DetailPanelBody className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users2 className="h-4 w-4 text-cyan-500" />
                  </div>
                  <p className="text-2xl font-bold">{bubble.counts.members}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Gift className="h-4 w-4 text-pink-500" />
                  </div>
                  <p className="text-2xl font-bold">{bubble.counts.wishlists}</p>
                  <p className="text-xs text-muted-foreground">Wishlists</p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ShoppingCart className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{bubble.counts.claims}</p>
                  <p className="text-xs text-muted-foreground">Claims</p>
                </div>
              </div>

              {/* Secret Santa Status */}
              {bubble.hasSecretSanta && (
                <DetailPanelAlert
                  variant="info"
                  icon={<Sparkles className="h-4 w-4" />}
                  className="bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                >
                  <p className="font-medium">Secret Santa has been drawn!</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Gift assignments are active for this group
                  </p>
                </DetailPanelAlert>
              )}

              {/* Owner */}
              <DetailPanelSection title="Owner" icon={<User className="h-4 w-4" />}>
                <DetailPanelCard onClick={() => onNavigateToUser?.(bubble.owner.id)}>
                  <p className="font-medium text-sm">
                    {bubble.owner.name || "No name"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bubble.owner.email}
                  </p>
                </DetailPanelCard>
              </DetailPanelSection>

              {/* Members */}
              <DetailPanelSection
                title="Members"
                icon={<Users2 className="h-4 w-4" />}
                count={bubble.counts.members}
              >
                <div className="space-y-2">
                  {bubble.members.slice(0, 6).map((m) => (
                    <DetailPanelCard
                      key={m.userId}
                      onClick={() => onNavigateToUser?.(m.userId)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarImage
                            src={m.user.image || m.user.avatarUrl || undefined}
                          />
                          <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                            {m.user.name?.slice(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {m.user.name || m.user.email}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {m.role}
                        </Badge>
                      </div>
                    </DetailPanelCard>
                  ))}
                  {bubble.counts.members > 6 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{bubble.counts.members - 6} more members
                    </p>
                  )}
                </div>
              </DetailPanelSection>

              {/* Wishlists */}
              <DetailPanelSection
                title="Wishlists"
                icon={<Gift className="h-4 w-4" />}
                count={bubble.counts.wishlists}
              >
                {bubble.wishlists.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No wishlists attached</p>
                ) : (
                  <div className="space-y-2">
                    {bubble.wishlists.map((w) => (
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
                          {w.ownerName || "Unknown"} · {w.itemCount} items
                        </p>
                      </DetailPanelCard>
                    ))}
                  </div>
                )}
              </DetailPanelSection>

              {/* Recent Activity */}
              <DetailPanelSection
                title="Recent Activity"
                icon={<Activity className="h-4 w-4" />}
              >
                {bubble.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No recent activity</p>
                ) : (
                  <div className="space-y-2">
                    {bubble.recentActivity.slice(0, 5).map((a) => (
                      <DetailPanelCard key={a.id}>
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <Badge variant="outline" className="text-xs">
                              {a.type.replace(/_/g, " ")}
                            </Badge>
                            {a.userName && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                by {a.userName}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </DetailPanelCard>
                    ))}
                  </div>
                )}
              </DetailPanelSection>
            </DetailPanelBody>

            <DetailPanelFooter>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/admin/groups/${bubble.id}`}>
                  <ExternalLink className="h-4 w-4" />
                  View Full Details
                </Link>
              </Button>
            </DetailPanelFooter>
          </>
        )}
      </DetailPanelContent>
    </DetailPanel>
  );
}

function BubblePanelSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
