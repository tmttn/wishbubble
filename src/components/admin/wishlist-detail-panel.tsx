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
} from "./detail-panel";
import {
  Gift,
  ExternalLink,
  Package,
  Users2,
  ShoppingCart,
  Star,
  Archive,
  User,
  Link as LinkIcon,
} from "lucide-react";
import { ItemImage } from "@/components/ui/item-image";

interface WishlistPanelData {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatarUrl: string | null;
  };
  items: Array<{
    id: string;
    title: string;
    price: string | null;
    currency: string;
    priority: string;
    imageUrl: string | null;
    url: string | null;
    createdAt: string;
    claim: {
      id: string;
      status: string;
      claimedAt: string;
      userName: string | null;
      userId: string | null;
      bubbleName: string | null;
      bubbleId: string | null;
    } | null;
  }>;
  sharedInBubbles: Array<{
    id: string;
    name: string;
    occasionType: string;
    isArchived: boolean;
  }>;
  counts: {
    items: number;
    bubbles: number;
    claims: number;
  };
}

interface WishlistDetailPanelProps {
  wishlistId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToUser?: (userId: string) => void;
  onNavigateToBubble?: (bubbleId: string) => void;
  onNavigateToItem?: (itemId: string) => void;
}

const priorityColors: Record<string, string> = {
  MUST_HAVE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  REALLY_WANT: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  WOULD_LOVE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  NICE_TO_HAVE: "bg-accent/10 text-accent-foreground border-accent/30",
  JUST_AN_IDEA: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

export function WishlistDetailPanel({
  wishlistId,
  open,
  onOpenChange,
  onNavigateToUser,
  onNavigateToBubble,
  onNavigateToItem,
}: WishlistDetailPanelProps) {
  const [wishlist, setWishlist] = useState<WishlistPanelData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishlistId || !open) {
      setWishlist(null);
      setError(null);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await fetch(`/api/admin/wishlists/${wishlistId}/panel`);
        if (!res.ok) {
          throw new Error("Failed to load wishlist");
        }
        const data = await res.json();
        startTransition(() => {
          setWishlist(data);
          setError(null);
        });
      } catch {
        startTransition(() => {
          setError("Failed to load wishlist details");
          setWishlist(null);
        });
      }
    };

    fetchWishlist();
  }, [wishlistId, open]);

  const loading = isPending || (!wishlist && !error && open && wishlistId);

  return (
    <DetailPanel open={open} onOpenChange={onOpenChange}>
      <DetailPanelContent>
        {loading && <WishlistPanelSkeleton />}

        {error && (
          <div className="flex items-center justify-center h-40 p-6">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {wishlist && (
          <>
            <DetailPanelHeader>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <Gift className="h-5 w-5 text-pink-500" />
                  </div>
                  <DetailPanelTitle>{wishlist.name}</DetailPanelTitle>
                  {wishlist.isDefault && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      Default
                    </Badge>
                  )}
                </div>
                {wishlist.description && (
                  <DetailPanelDescription className="line-clamp-2">
                    {wishlist.description}
                  </DetailPanelDescription>
                )}
              </div>
            </DetailPanelHeader>

            <DetailPanelBody className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <DetailPanelStat
                  label="Items"
                  value={wishlist.counts.items}
                  icon={<Package className="h-4 w-4" />}
                />
                <DetailPanelStat
                  label="Claimed"
                  value={wishlist.counts.claims}
                  icon={<ShoppingCart className="h-4 w-4" />}
                />
                <DetailPanelStat
                  label="In Groups"
                  value={wishlist.counts.bubbles}
                  icon={<Users2 className="h-4 w-4" />}
                />
              </div>

              {/* Owner */}
              <DetailPanelSection title="Owner" icon={<User className="h-4 w-4" />}>
                <DetailPanelCard onClick={() => onNavigateToUser?.(wishlist.owner.id)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage
                        src={wishlist.owner.image || wishlist.owner.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-sm font-medium bg-muted text-muted-foreground">
                        {wishlist.owner.name?.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {wishlist.owner.name || "No name"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {wishlist.owner.email}
                      </p>
                    </div>
                  </div>
                </DetailPanelCard>
              </DetailPanelSection>

              {/* Items */}
              <DetailPanelSection
                title="Items"
                icon={<Package className="h-4 w-4" />}
                count={wishlist.counts.items}
              >
                {wishlist.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No items</p>
                ) : (
                  <div className="space-y-2">
                    {wishlist.items.map((item) => (
                      <DetailPanelCard
                        key={item.id}
                        onClick={() => onNavigateToItem?.(item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <ItemImage
                            src={item.imageUrl}
                            alt={item.title}
                            size="sm"
                            rounded="lg"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">
                                {item.title}
                              </p>
                              {item.claim && (
                                <Badge
                                  variant="outline"
                                  className={
                                    item.claim.status === "PURCHASED"
                                      ? "bg-accent/10 text-accent-foreground border-accent/30"
                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                  }
                                >
                                  {item.claim.status}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {item.price && (
                                <span className="text-sm font-medium">
                                  {item.currency} {parseFloat(item.price).toFixed(2)}
                                </span>
                              )}
                              {item.priority && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${priorityColors[item.priority] || priorityColors.NICE_TO_HAVE}`}
                                >
                                  {item.priority.replace(/_/g, " ")}
                                </Badge>
                              )}
                              {item.url && (
                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </DetailPanelCard>
                    ))}
                    {wishlist.counts.items > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{wishlist.counts.items - 10} more items
                      </p>
                    )}
                  </div>
                )}
              </DetailPanelSection>

              {/* Shared in Bubbles */}
              <DetailPanelSection
                title="Shared In Groups"
                icon={<Users2 className="h-4 w-4" />}
                count={wishlist.counts.bubbles}
              >
                {wishlist.sharedInBubbles.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Not shared in any groups</p>
                ) : (
                  <div className="space-y-2">
                    {wishlist.sharedInBubbles.map((bubble) => (
                      <DetailPanelCard
                        key={bubble.id}
                        onClick={() => onNavigateToBubble?.(bubble.id)}
                        className={bubble.isArchived ? "opacity-60" : ""}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm truncate">
                              {bubble.name}
                            </span>
                            {bubble.isArchived && (
                              <Archive className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {bubble.occasionType}
                          </Badge>
                        </div>
                      </DetailPanelCard>
                    ))}
                  </div>
                )}
              </DetailPanelSection>
            </DetailPanelBody>

            <DetailPanelFooter>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/admin/wishlists/${wishlist.id}`}>
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

function WishlistPanelSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}
