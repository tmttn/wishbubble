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
  DetailPanelBody,
  DetailPanelFooter,
  DetailPanelSection,
  DetailPanelCard,
  DetailPanelAlert,
} from "./detail-panel";
import {
  Package,
  ExternalLink,
  User,
  Gift,
  ShoppingCart,
  Link as LinkIcon,
  Trash2,
  Users2,
  DollarSign,
  Calendar,
} from "lucide-react";
import { ItemImage } from "@/components/ui/item-image";

interface ItemPanelData {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  priceMax: string | null;
  currency: string;
  url: string | null;
  imageUrl: string | null;
  uploadedImage: string | null;
  priority: string;
  quantity: number;
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
  wishlist: {
    id: string;
    name: string;
    isDefault: boolean;
    owner: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      avatarUrl: string | null;
    };
  };
  claims: Array<{
    id: string;
    status: string;
    quantity: number;
    isGroupGift: boolean;
    contribution: string | null;
    claimedAt: string;
    purchasedAt: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      avatarUrl: string | null;
    };
    bubble: {
      id: string;
      name: string;
    };
  }>;
  counts: {
    claims: number;
    totalQuantityClaimed: number;
  };
}

interface ItemDetailPanelProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToUser?: (userId: string) => void;
  onNavigateToWishlist?: (wishlistId: string) => void;
  onNavigateToBubble?: (bubbleId: string) => void;
}

const priorityColors: Record<string, string> = {
  MUST_HAVE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  REALLY_WANT: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  WOULD_LOVE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  NICE_TO_HAVE: "bg-accent/10 text-accent-foreground border-accent/30",
  JUST_AN_IDEA: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

export function ItemDetailPanel({
  itemId,
  open,
  onOpenChange,
  onNavigateToUser,
  onNavigateToWishlist,
  onNavigateToBubble,
}: ItemDetailPanelProps) {
  const [item, setItem] = useState<ItemPanelData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId || !open) {
      setItem(null);
      setError(null);
      return;
    }

    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/admin/items/${itemId}/panel`);
        if (!res.ok) {
          throw new Error("Failed to load item");
        }
        const data = await res.json();
        startTransition(() => {
          setItem(data);
          setError(null);
        });
      } catch {
        startTransition(() => {
          setError("Failed to load item details");
          setItem(null);
        });
      }
    };

    fetchItem();
  }, [itemId, open]);

  const loading = isPending || (!item && !error && open && itemId);

  const formatPrice = (price: string | null, priceMax: string | null, currency: string) => {
    if (!price) return null;
    const formatted = parseFloat(price).toFixed(2);
    if (priceMax) {
      const formattedMax = parseFloat(priceMax).toFixed(2);
      return `${currency} ${formatted} - ${formattedMax}`;
    }
    return `${currency} ${formatted}`;
  };

  return (
    <DetailPanel open={open} onOpenChange={onOpenChange}>
      <DetailPanelContent>
        {loading && <ItemPanelSkeleton />}

        {error && (
          <div className="flex items-center justify-center h-40 p-6">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {item && (
          <>
            <DetailPanelHeader>
              <div className="flex gap-4">
                {/* Item Image */}
                <ItemImage
                  src={item.imageUrl || item.uploadedImage}
                  alt={item.title}
                  size="lg"
                  rounded="xl"
                  containerClassName="border border-border/50"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <DetailPanelTitle className="line-clamp-2">{item.title}</DetailPanelTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={priorityColors[item.priority] || priorityColors.NICE_TO_HAVE}
                    >
                      {item.priority.replace(/_/g, " ")}
                    </Badge>
                    {item.isDeleted && (
                      <Badge variant="destructive" className="gap-1">
                        <Trash2 className="h-3 w-3" />
                        Deleted
                      </Badge>
                    )}
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      View product link
                    </a>
                  )}
                </div>
              </div>
            </DetailPanelHeader>

            <DetailPanelBody className="space-y-6">
              {/* Deleted Warning */}
              {item.isDeleted && (
                <DetailPanelAlert variant="warning" icon={<Trash2 className="h-4 w-4" />}>
                  <p className="font-medium">This item has been deleted</p>
                  <p className="text-sm text-muted-foreground">
                    Deleted on {new Date(item.deletedAt!).toLocaleDateString()}
                  </p>
                </DetailPanelAlert>
              )}

              {/* Price & Quantity Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">Price</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatPrice(item.price, item.priceMax, item.currency) || "Not set"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Quantity</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {item.counts.totalQuantityClaimed}/{item.quantity} claimed
                  </p>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <DetailPanelSection title="Description">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </DetailPanelSection>
              )}

              {/* Notes */}
              {item.notes && (
                <DetailPanelSection title="Notes">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {item.notes}
                  </p>
                </DetailPanelSection>
              )}

              {/* Wishlist */}
              <DetailPanelSection title="Wishlist" icon={<Gift className="h-4 w-4" />}>
                <DetailPanelCard onClick={() => onNavigateToWishlist?.(item.wishlist.id)}>
                  <p className="font-medium text-sm">{item.wishlist.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Owned by {item.wishlist.owner.name || item.wishlist.owner.email}
                  </p>
                </DetailPanelCard>
              </DetailPanelSection>

              {/* Owner */}
              <DetailPanelSection title="Owner" icon={<User className="h-4 w-4" />}>
                <DetailPanelCard onClick={() => onNavigateToUser?.(item.wishlist.owner.id)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage
                        src={item.wishlist.owner.image || item.wishlist.owner.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-sm font-medium bg-muted text-muted-foreground">
                        {item.wishlist.owner.name?.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.wishlist.owner.name || "No name"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.wishlist.owner.email}
                      </p>
                    </div>
                  </div>
                </DetailPanelCard>
              </DetailPanelSection>

              {/* Claims */}
              <DetailPanelSection
                title="Claims"
                icon={<ShoppingCart className="h-4 w-4" />}
                count={item.counts.claims}
              >
                {item.claims.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No claims</p>
                ) : (
                  <div className="space-y-2">
                    {item.claims.map((claim) => (
                      <DetailPanelCard key={claim.id}>
                        <div className="flex items-start gap-3">
                          <Avatar
                            className="h-8 w-8 border border-border/50 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToUser?.(claim.user.id);
                            }}
                          >
                            <AvatarImage
                              src={claim.user.image || claim.user.avatarUrl || undefined}
                            />
                            <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                              {claim.user.name?.slice(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className="font-medium text-sm truncate cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToUser?.(claim.user.id);
                                }}
                              >
                                {claim.user.name || claim.user.email}
                              </p>
                              <Badge
                                variant="outline"
                                className={
                                  claim.status === "PURCHASED"
                                    ? "bg-accent/10 text-accent-foreground border-accent/30"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                }
                              >
                                {claim.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <button
                                className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToBubble?.(claim.bubble.id);
                                }}
                              >
                                <Users2 className="h-3 w-3" />
                                {claim.bubble.name}
                              </button>
                              {claim.isGroupGift && (
                                <Badge variant="secondary" className="text-xs">
                                  Group Gift
                                </Badge>
                              )}
                              {claim.quantity > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  Qty: {claim.quantity}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Claimed {new Date(claim.claimedAt).toLocaleDateString()}
                              {claim.purchasedAt && (
                                <span>
                                  {" "}· Purchased {new Date(claim.purchasedAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </DetailPanelCard>
                    ))}
                  </div>
                )}
              </DetailPanelSection>
            </DetailPanelBody>

            <DetailPanelFooter>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/admin/items/${item.id}`}>
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

function ItemPanelSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
