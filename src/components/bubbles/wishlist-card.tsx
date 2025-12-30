"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExternalLink,
  Gift,
  ShoppingCart,
  Check,
  Loader2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  price: unknown;
  priceMax: unknown;
  currency: string;
  url: string | null;
  imageUrl: string | null;
  priority: string;
  quantity: number;
  notes: string | null;
}

interface Claim {
  id: string;
  userId: string;
  itemId: string;
  status: string;
  quantity: number;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  item: {
    id: string;
    wishlistId: string;
  };
}

interface Wishlist {
  id: string;
  name: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  items: WishlistItem[];
}

interface WishlistCardProps {
  wishlist: Wishlist;
  claims: Claim[];
  isOwnWishlist: boolean;
  bubbleId: string;
  currentUserId: string;
}

export function WishlistCard({
  wishlist,
  claims,
  isOwnWishlist,
  bubbleId,
  currentUserId,
}: WishlistCardProps) {
  const t = useTranslations("claims");
  const tWishlist = useTranslations("wishlist");
  const tCommon = useTranslations("common");

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "MUST_HAVE":
        return "destructive";
      case "DREAM":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatPrice = (price: unknown, priceMax: unknown, currency: string) => {
    const p = Number(price);
    const pMax = Number(priceMax);

    if (!p && !pMax) return null;

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
    });

    if (p && pMax && p !== pMax) {
      return `${formatter.format(p)} - ${formatter.format(pMax)}`;
    }
    return formatter.format(p || pMax);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={wishlist.user.avatarUrl || undefined} />
            <AvatarFallback>{getInitials(wishlist.user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              {tWishlist("yourWishlist", { name: wishlist.user.name || "Unknown" })}
            </CardTitle>
            <CardDescription>
              {wishlist.items.length} {wishlist.items.length === 1 ? "item" : "items"}
              {isOwnWishlist && ` ${tWishlist("thisIsYours")}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {wishlist.items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {tWishlist("noItems")}
          </p>
        ) : (
          <div className="space-y-4">
            {wishlist.items.map((item) => {
              const itemClaims = claims.filter((c) => c.item.id === item.id);
              const totalClaimed = itemClaims.reduce(
                (sum, c) => sum + c.quantity,
                0
              );
              const isFullyClaimed = totalClaimed >= item.quantity;
              const userClaim = itemClaims.find(
                (c) => c.userId === currentUserId
              );

              return (
                <WishlistItemRow
                  key={item.id}
                  item={item}
                  claims={itemClaims}
                  isOwnWishlist={isOwnWishlist}
                  isFullyClaimed={isFullyClaimed}
                  userClaim={userClaim}
                  bubbleId={bubbleId}
                  formatPrice={formatPrice}
                  getPriorityColor={getPriorityColor}
                  t={t}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WishlistItemRow({
  item,
  claims,
  isOwnWishlist,
  isFullyClaimed,
  userClaim,
  bubbleId,
  formatPrice,
  getPriorityColor,
  t,
}: {
  item: WishlistItem;
  claims: Claim[];
  isOwnWishlist: boolean;
  isFullyClaimed: boolean;
  userClaim: Claim | undefined;
  bubbleId: string;
  formatPrice: (price: unknown, priceMax: unknown, currency: string) => string | null;
  getPriorityColor: (priority: string) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const tPriority = useTranslations("wishlist.priority");
  const tWishlist = useTranslations("wishlist");
  const tToasts = useTranslations("toasts");

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          bubbleId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tToasts("error.claimFailed"));
      }

      toast.success(tToasts("success.itemClaimed"));
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.claimFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnclaim = async () => {
    if (!userClaim) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/claims", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: userClaim.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tToasts("error.unclaimFailed"));
      }

      toast.success(tToasts("success.claimRemoved"));
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.unclaimFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPurchased = async () => {
    if (!userClaim) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: userClaim.id,
          status: "PURCHASED",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tToasts("error.purchaseFailed"));
      }

      toast.success(tToasts("success.markedPurchased"));
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.purchaseFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const price = formatPrice(item.price, item.priceMax, item.currency);

  return (
    <div className="flex gap-4 p-4 rounded-lg border">
      {/* Image */}
      {item.imageUrl && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium line-clamp-1">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <Badge variant={getPriorityColor(item.priority) as "destructive" | "secondary" | "outline"}>
            {tPriority(item.priority as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")}
          </Badge>
        </div>

        <div className="mt-2 flex items-center gap-3 text-sm">
          {price && <span className="font-medium">{price}</span>}
          {item.quantity > 1 && (
            <span className="text-muted-foreground">{tWishlist("quantity", { count: item.quantity })}</span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {tWishlist("view")}
            </a>
          )}
        </div>

        {item.notes && (
          <p className="mt-2 text-sm text-muted-foreground italic">
            {tWishlist("note", { note: item.notes })}
          </p>
        )}

        {/* Claim status - only show if not own wishlist */}
        {!isOwnWishlist && (
          <div className="mt-3 flex items-center gap-2">
            {isFullyClaimed ? (
              claims.map((claim) => (
                <Badge
                  key={claim.id}
                  variant={claim.status === "PURCHASED" ? "default" : "secondary"}
                >
                  {claim.status === "PURCHASED" ? (
                    <Check className="mr-1 h-3 w-3" />
                  ) : (
                    <ShoppingCart className="mr-1 h-3 w-3" />
                  )}
                  {claim.status === "PURCHASED"
                    ? t("purchasedBy", { name: claim.user.name || "Someone" })
                    : t("claimedBy", { name: claim.user.name || "Someone" })}
                </Badge>
              ))
            ) : userClaim ? (
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  {tWishlist("claimedByYou", { status: t("claimed") })}
                </Badge>
                {userClaim.status !== "PURCHASED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkPurchased}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          {t("markPurchased")}
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUnclaim}
                      disabled={isLoading}
                    >
                      <Undo2 className="mr-1 h-4 w-4" />
                      {t("unclaim")}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleClaim}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Gift className="mr-1 h-4 w-4" />
                    {t("claim")}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
