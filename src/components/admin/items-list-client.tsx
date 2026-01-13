"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Tag, ShoppingCart } from "lucide-react";
import { ItemDetailPanel } from "./item-detail-panel";
import { UserDetailPanel } from "./user-detail-panel";
import { WishlistDetailPanel } from "./wishlist-detail-panel";
import { BubbleDetailPanel } from "./bubble-detail-panel";

interface Item {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  price: { toString(): string } | null;
  currency: string;
  url: string | null;
  createdAt: Date;
  wishlist: {
    id: string;
    name: string;
    isDefault: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  claims: Array<{
    id: string;
    status: string;
    user: {
      id: string;
      name: string | null;
    };
  }>;
}

interface ItemsListClientProps {
  items: Item[];
  labels: {
    owner: string;
    wishlist: string;
    default: string;
    highPriority: string;
    unclaimed: string;
    unknown: string;
  };
}

export function ItemsListClient({ items, labels }: ItemsListClientProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemPanelOpen, setItemPanelOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);
  const [wishlistPanelOpen, setWishlistPanelOpen] = useState(false);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [bubblePanelOpen, setBubblePanelOpen] = useState(false);

  const handleItemClick = (itemId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    e.preventDefault();
    setSelectedItemId(itemId);
    setItemPanelOpen(true);
  };

  const handleOwnerClick = (ownerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUserId(ownerId);
    setUserPanelOpen(true);
  };

  const handleClaimUserClick = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUserId(userId);
    setUserPanelOpen(true);
  };

  const handleNavigateToUser = (userId: string) => {
    setItemPanelOpen(false);
    setWishlistPanelOpen(false);
    setBubblePanelOpen(false);
    setSelectedUserId(userId);
    setUserPanelOpen(true);
  };

  const handleNavigateToWishlist = (wishlistId: string) => {
    setItemPanelOpen(false);
    setUserPanelOpen(false);
    setBubblePanelOpen(false);
    setSelectedWishlistId(wishlistId);
    setWishlistPanelOpen(true);
  };

  const handleNavigateToBubble = (bubbleId: string) => {
    setItemPanelOpen(false);
    setUserPanelOpen(false);
    setWishlistPanelOpen(false);
    setSelectedBubbleId(bubbleId);
    setBubblePanelOpen(true);
  };

  const handleNavigateToItem = (itemId: string) => {
    setUserPanelOpen(false);
    setWishlistPanelOpen(false);
    setBubblePanelOpen(false);
    setSelectedItemId(itemId);
    setItemPanelOpen(true);
  };

  return (
    <>
      <div className="grid gap-3">
        {items.map((item, index) => {
          const isClaimed = item.claims.length > 0;
          const isPurchased = item.claims.some((c) => c.status === "PURCHASED");

          return (
            <Link
              key={item.id}
              href={`/admin/items/${item.id}`}
              onClick={(e) => handleItemClick(item.id, e)}
            >
              <Card
                className={`border-0 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer ${
                  isPurchased
                    ? "bg-gradient-to-r from-accent/10 to-accent/5"
                    : isClaimed
                    ? "bg-gradient-to-r from-blue-500/10 to-blue-500/5"
                    : "bg-card/80"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {item.priority === "MUST_HAVE" && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                            <Tag className="h-3 w-3 mr-1" />
                            {labels.highPriority}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <button
                          onClick={(e) => handleOwnerClick(item.wishlist.user.id, e)}
                          className="hover:underline hover:text-foreground transition-colors"
                        >
                          {labels.owner}: {item.wishlist.user.name || item.wishlist.user.email}
                        </button>
                        <span className="text-muted-foreground/50">|</span>
                        <span>
                          {labels.wishlist}: {item.wishlist.name}
                          {item.wishlist.isDefault && ` (${labels.default})`}
                        </span>
                        {item.price && (
                          <>
                            <span className="text-muted-foreground/50">|</span>
                            <span className="font-medium text-foreground">
                              {item.currency} {Number(item.price).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.claims.length > 0 ? (
                        item.claims.map((claim) => (
                          <Badge
                            key={claim.id}
                            className={
                              claim.status === "PURCHASED"
                                ? "bg-accent/10 text-accent-foreground border-accent/30"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            }
                          >
                            {claim.status === "PURCHASED" ? (
                              <ShoppingCart className="h-3 w-3 mr-1" />
                            ) : null}
                            {claim.status}{" "}
                            <button
                              onClick={(e) => handleClaimUserClick(claim.user.id, e)}
                              className="hover:underline ml-1"
                            >
                              {claim.user.name || labels.unknown}
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          {labels.unclaimed}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {item.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <ItemDetailPanel
        itemId={selectedItemId}
        open={itemPanelOpen}
        onOpenChange={setItemPanelOpen}
        onNavigateToUser={handleNavigateToUser}
        onNavigateToWishlist={handleNavigateToWishlist}
        onNavigateToBubble={handleNavigateToBubble}
      />

      <UserDetailPanel
        userId={selectedUserId}
        open={userPanelOpen}
        onOpenChange={setUserPanelOpen}
        onNavigateToBubble={handleNavigateToBubble}
      />

      <WishlistDetailPanel
        wishlistId={selectedWishlistId}
        open={wishlistPanelOpen}
        onOpenChange={setWishlistPanelOpen}
        onNavigateToUser={handleNavigateToUser}
        onNavigateToBubble={handleNavigateToBubble}
        onNavigateToItem={handleNavigateToItem}
      />

      <BubbleDetailPanel
        bubbleId={selectedBubbleId}
        open={bubblePanelOpen}
        onOpenChange={setBubblePanelOpen}
        onNavigateToUser={handleNavigateToUser}
      />
    </>
  );
}
