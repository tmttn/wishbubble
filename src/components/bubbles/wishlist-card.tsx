"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTypedTranslations, TypedTranslateFunction } from "@/i18n/useTypedTranslations";
import { ItemImage } from "@/components/ui/item-image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import {
  ExternalLink,
  Gift,
  ShoppingCart,
  Check,
  Loader2,
  Undo2,
  Star,
  Heart,
  Sparkles,
  CircleDollarSign,
  Filter,
  Plus,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  uploadedImage: string | null;
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
    image: string | null;
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
    image?: string | null;
    subscriptionTier?: string;
  };
  items: WishlistItem[];
}

interface WishlistCardProps {
  wishlists: Wishlist[];
  claims: Claim[];
  isOwnWishlist: boolean;
  bubbleId: string;
  currentUserId: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
}

export function WishlistCard({
  wishlists,
  claims,
  isOwnWishlist,
  bubbleId,
  currentUserId,
  budgetMin,
  budgetMax,
}: WishlistCardProps) {
  const router = useRouter();
  const t = useTypedTranslations("claims");
  const tWishlist = useTypedTranslations("wishlist");
  const _tCommon = useTypedTranslations("common");
  const tBubbles = useTypedTranslations("bubbles");
  const tToasts = useTypedTranslations("toasts");
  const [showOnlyInBudget, setShowOnlyInBudget] = useState(false);
  const [detachingId, setDetachingId] = useState<string | null>(null);

  // Use first wishlist for user info (all wishlists belong to same user)
  const primaryWishlist = wishlists[0];

  // Merge all items from all wishlists
  const allItems = wishlists.flatMap((wl) => wl.items);

  // Detach a wishlist from the bubble
  const handleDetach = async (wishlistId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDetachingId(wishlistId);
    try {
      const response = await fetch(
        `/api/bubbles/${bubbleId}/attach-wishlist?wishlistId=${wishlistId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to detach wishlist");
      }

      toast.success(tToasts("success.wishlistRemoved"));
      router.refresh();
    } catch {
      toast.error(tToasts("error.generic"));
    } finally {
      setDetachingId(null);
    }
  };

  // Check if an item is within budget
  const isItemInBudget = (item: WishlistItem): boolean | null => {
    const itemPrice = Number(item.price) || Number(item.priceMax);
    if (!itemPrice) return null; // No price set, can't determine
    if (!budgetMin && !budgetMax) return null; // No budget set

    const min = budgetMin || 0;
    const max = budgetMax || Infinity;

    return itemPrice >= min && itemPrice <= max;
  };

  // Count items in/out of budget
  const budgetStats = allItems.reduce(
    (acc, item) => {
      const inBudget = isItemInBudget(item);
      if (inBudget === true) acc.inBudget++;
      else if (inBudget === false) acc.outOfBudget++;
      else acc.noPrice++;
      return acc;
    },
    { inBudget: 0, outOfBudget: 0, noPrice: 0 }
  );

  const hasBudget = budgetMin !== null || budgetMax !== null;

  // Filter items if toggle is on
  const displayedItems = showOnlyInBudget
    ? allItems.filter((item) => isItemInBudget(item) !== false)
    : allItems;

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "MUST_HAVE":
        return {
          variant: "destructive" as const,
          icon: Star,
          gradient: "from-red-500 to-orange-500",
          bgGradient: "from-red-500/10 to-orange-500/10",
          borderColor: "border-red-200 dark:border-red-900/50",
        };
      case "DREAM":
        return {
          variant: "secondary" as const,
          icon: Sparkles,
          gradient: "from-primary to-accent",
          bgGradient: "from-primary/10 to-accent/10",
          borderColor: "border-primary/20 dark:border-primary/30",
        };
      default:
        return {
          variant: "outline" as const,
          icon: Heart,
          gradient: "from-accent to-primary/70",
          bgGradient: "from-accent/5 to-primary/5",
          borderColor: "border-border",
        };
    }
  };

  // Generate a consistent gradient based on user name
  const getAvatarGradient = (name: string | null) => {
    const gradients = [
      "from-primary to-primary/70",
      "from-primary/80 to-accent",
      "from-accent to-accent/70",
      "from-accent/80 to-primary",
      "from-primary/60 to-accent/80",
      "from-accent/60 to-primary/80",
    ];
    const index = name ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  const avatarGradient = getAvatarGradient(primaryWishlist.user.name);

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
    <Card className="overflow-hidden card-hover group">
      {/* Gradient accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${avatarGradient}`} />

      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar with gradient ring */}
          <div className={`relative p-0.5 rounded-full bg-gradient-to-br ${avatarGradient} shrink-0`}>
            <PremiumAvatar
              src={primaryWishlist.user.image || primaryWishlist.user.avatarUrl}
              fallback={getInitials(primaryWishlist.user.name)}
              isPremium={!!primaryWishlist.user.subscriptionTier && primaryWishlist.user.subscriptionTier !== "BASIC"}
              size="lg"
              className="border-2 border-background"
              fallbackClassName={`bg-gradient-to-br ${avatarGradient}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-lg font-semibold truncate">
                  {tWishlist("yourWishlist", { name: primaryWishlist.user.name || "Unknown" })}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5" />
                    {allItems.length} {allItems.length === 1 ? "wish" : "wishes"}
                  </span>
                  {isOwnWishlist && (
                    <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                      {tWishlist("thisIsYours")}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              {isOwnWishlist && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 shrink-0 hidden sm:inline-flex"
                >
                  <Link href="/wishlist?add=true">
                    <Plus className="h-3.5 w-3.5" />
                    {tWishlist("addItems")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Show shared wishlists for own wishlists */}
        {isOwnWishlist && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{tWishlist("sharedLists")}:</span>
            {wishlists.map((wl) => (
              <Badge
                key={wl.id}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors gap-1 pr-1"
              >
                <Link href="/wishlist" className="hover:underline">
                  {wl.name}
                </Link>
                <button
                  onClick={(e) => handleDetach(wl.id, e)}
                  disabled={detachingId === wl.id}
                  className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                  title={tWishlist("removeFromBubble")}
                >
                  {detachingId === wl.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Mobile-only button */}
        {isOwnWishlist && (
          <div className="mt-3 sm:hidden">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Link href="/wishlist?add=true">
                <Plus className="h-3.5 w-3.5" />
                {tWishlist("addItems")}
              </Link>
            </Button>
          </div>
        )}
      </CardHeader>

      {/* Budget filter toggle - only show when budget is set and not own wishlist */}
      {hasBudget && !isOwnWishlist && budgetStats.outOfBudget > 0 && (
        <div className="px-6 pb-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Label htmlFor={`budget-filter-${primaryWishlist.id}`} className="text-xs text-muted-foreground cursor-pointer">
                {tBubbles("budget.showOnlyInBudget")}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {budgetStats.inBudget}/{allItems.length - budgetStats.noPrice}
              </span>
              <Switch
                id={`budget-filter-${primaryWishlist.id}`}
                checked={showOnlyInBudget}
                onCheckedChange={setShowOnlyInBudget}
                className="scale-75"
              />
            </div>
          </div>
        </div>
      )}

      <CardContent className="pt-0">
        {displayedItems.length === 0 ? (
          <div className="text-center py-8">
            <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient} opacity-20 flex items-center justify-center mb-3`}>
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {tWishlist("noItems")}
            </p>
            {isOwnWishlist && (
              <Button asChild className="gap-2">
                <Link href="/wishlist?add=true">
                  <Plus className="h-4 w-4" />
                  {tWishlist("addItems")}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedItems.map((item) => {
              const itemClaims = claims.filter((c) => c.item.id === item.id);
              const totalClaimed = itemClaims.reduce(
                (sum, c) => sum + c.quantity,
                0
              );
              const isFullyClaimed = totalClaimed >= item.quantity;
              const userClaim = itemClaims.find(
                (c) => c.userId === currentUserId
              );
              const itemBudgetStatus = isItemInBudget(item);

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
                  getPriorityConfig={getPriorityConfig}
                  t={t}
                  budgetStatus={itemBudgetStatus}
                  hasBudget={hasBudget}
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
  getPriorityConfig,
  t,
  budgetStatus,
  hasBudget,
}: {
  item: WishlistItem;
  claims: Claim[];
  isOwnWishlist: boolean;
  isFullyClaimed: boolean;
  userClaim: Claim | undefined;
  bubbleId: string;
  formatPrice: (price: unknown, priceMax: unknown, currency: string) => string | null;
  getPriorityConfig: (priority: string) => {
    variant: "destructive" | "secondary" | "outline";
    icon: typeof Star;
    gradient: string;
    bgGradient: string;
    borderColor: string;
  };
  t: TypedTranslateFunction<"claims">;
  budgetStatus: boolean | null;
  hasBudget: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const tPriority = useTypedTranslations("wishlist.priority");
  const tWishlist = useTypedTranslations("wishlist");
  const tToasts = useTypedTranslations("toasts");
  const tBubbles = useTypedTranslations("bubbles");

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
  const priorityConfig = getPriorityConfig(item.priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className={`relative flex gap-3 p-3 rounded-lg border bg-gradient-to-r ${priorityConfig.bgGradient} ${priorityConfig.borderColor} transition-all duration-200 hover:shadow-sm`}>
      {/* Priority indicator line */}
      <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b ${priorityConfig.gradient}`} />

      {/* Image - prefer uploaded image over scraped URL */}
      {(item.uploadedImage || item.imageUrl) && (
        <ItemImage
          src={item.uploadedImage || item.imageUrl!}
          alt={item.title}
          containerClassName="ml-1"
        />
      )}

      {/* Content */}
      <div className={`flex-1 min-w-0 ${!(item.uploadedImage || item.imageUrl) ? 'ml-1' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
            {item.description && (
              <p
                className={`text-xs text-muted-foreground mt-0.5 cursor-pointer ${
                  isDescriptionExpanded ? "" : "line-clamp-1"
                }`}
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {item.description}
              </p>
            )}
          </div>
          <Badge
            variant={priorityConfig.variant}
            className={`shrink-0 gap-1 text-[10px] px-1.5 py-0.5 ${
              item.priority === "MUST_HAVE"
                ? "bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white"
                : item.priority === "DREAM"
                ? "bg-gradient-to-r from-primary to-accent border-0 text-white"
                : ""
            }`}
          >
            <PriorityIcon className="h-2.5 w-2.5" />
            {tPriority(item.priority as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")}
          </Badge>
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-xs flex-wrap">
          {price && (
            <span className="font-semibold text-sm text-primary">
              {price}
            </span>
          )}
          {/* Budget indicator badge */}
          {hasBudget && !isOwnWishlist && budgetStatus !== null && (
            <Badge
              variant={budgetStatus ? "outline" : "secondary"}
              className={`text-[10px] px-1.5 py-0.5 gap-1 ${
                budgetStatus
                  ? "bg-accent/10 border-accent/30 text-accent-foreground"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              <CircleDollarSign className="h-2.5 w-2.5" />
              {budgetStatus ? tBubbles("budget.inBudget") : tBubbles("budget.overBudget")}
            </Badge>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Claim status - only show if not own wishlist */}
        {!isOwnWishlist && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {isFullyClaimed ? (
              claims.map((claim) => (
                <Badge
                  key={claim.id}
                  variant={claim.status === "PURCHASED" ? "default" : "secondary"}
                  className={`text-[10px] px-1.5 py-0.5 ${claim.status === "PURCHASED"
                    ? "bg-gradient-to-r from-primary to-accent border-0 text-primary-foreground gap-1"
                    : "gap-1"
                  }`}
                >
                  {claim.status === "PURCHASED" ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <ShoppingCart className="h-2.5 w-2.5" />
                  )}
                  {claim.status === "PURCHASED"
                    ? t("purchasedBy", { name: claim.user.name || "Someone" })
                    : t("claimedBy", { name: claim.user.name || "Someone" })}
                </Badge>
              ))
            ) : userClaim ? (
              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                  <ShoppingCart className="h-2.5 w-2.5" />
                  {tWishlist("claimedByYou", { status: t("claimed") })}
                </Badge>
                {userClaim.status !== "PURCHASED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkPurchased}
                      disabled={isLoading}
                      className="h-5 text-[10px] px-1.5 gap-1 bg-accent/10 border-accent/30 text-accent-foreground hover:bg-accent/20"
                    >
                      {isLoading ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-2.5 w-2.5" />
                          {t("markPurchased")}
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUnclaim}
                      disabled={isLoading}
                      className="h-5 text-[10px] px-1.5 gap-1"
                    >
                      <Undo2 className="h-2.5 w-2.5" />
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
                className="h-6 text-xs px-2 gap-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Gift className="h-3 w-3" />
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
