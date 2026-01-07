"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, Star } from "lucide-react";
import { WishlistDetailPanel } from "./wishlist-detail-panel";
import { UserDetailPanel } from "./user-detail-panel";
import { BubbleDetailPanel } from "./bubble-detail-panel";
import { ItemDetailPanel } from "./item-detail-panel";

interface Wishlist {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: Array<{ id: string }>;
  bubbles: Array<{
    bubble: {
      id: string;
      name: string;
    };
  }>;
}

interface WishlistsListClientProps {
  wishlists: Wishlist[];
  labels: {
    owner: string;
    itemCount: string;
    sharedIn: string;
    default: string;
    more: string;
  };
}

export function WishlistsListClient({ wishlists, labels }: WishlistsListClientProps) {
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);
  const [wishlistPanelOpen, setWishlistPanelOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [bubblePanelOpen, setBubblePanelOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemPanelOpen, setItemPanelOpen] = useState(false);

  const handleWishlistClick = (wishlistId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    e.preventDefault();
    setSelectedWishlistId(wishlistId);
    setWishlistPanelOpen(true);
  };

  const handleOwnerClick = (ownerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUserId(ownerId);
    setUserPanelOpen(true);
  };

  const handleBubbleClick = (bubbleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedBubbleId(bubbleId);
    setBubblePanelOpen(true);
  };

  const handleNavigateToUser = (userId: string) => {
    setWishlistPanelOpen(false);
    setBubblePanelOpen(false);
    setSelectedUserId(userId);
    setUserPanelOpen(true);
  };

  const handleNavigateToBubble = (bubbleId: string) => {
    setWishlistPanelOpen(false);
    setUserPanelOpen(false);
    setSelectedBubbleId(bubbleId);
    setBubblePanelOpen(true);
  };

  const handleNavigateToWishlist = (wishlistId: string) => {
    setUserPanelOpen(false);
    setBubblePanelOpen(false);
    setSelectedWishlistId(wishlistId);
    setWishlistPanelOpen(true);
  };

  const handleNavigateToItem = (itemId: string) => {
    setWishlistPanelOpen(false);
    setUserPanelOpen(false);
    setBubblePanelOpen(false);
    setSelectedItemId(itemId);
    setItemPanelOpen(true);
  };

  return (
    <>
      <div className="grid gap-3">
        {wishlists.map((wishlist, index) => {
          const itemCount = wishlist.items.length;
          const bubbleCount = wishlist.bubbles.length;

          return (
            <Link
              key={wishlist.id}
              href={`/admin/wishlists/${wishlist.id}`}
              onClick={(e) => handleWishlistClick(wishlist.id, e)}
            >
              <Card
                className={`border-0 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer ${
                  wishlist.isDefault
                    ? "bg-gradient-to-r from-amber-500/10 to-amber-500/5"
                    : "bg-card/80"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                          {wishlist.name}
                        </span>
                        {wishlist.isDefault && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                            <Star className="h-3 w-3 mr-1" />
                            {labels.default}
                          </Badge>
                        )}
                      </div>
                      {wishlist.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {wishlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <button
                          onClick={(e) => handleOwnerClick(wishlist.user.id, e)}
                          className="hover:underline hover:text-foreground transition-colors"
                        >
                          {labels.owner}: {wishlist.user.name || wishlist.user.email}
                        </button>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {labels.itemCount.replace("{count}", String(itemCount))}
                        </span>
                        {bubbleCount > 0 && (
                          <>
                            <span className="text-muted-foreground/50">|</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {labels.sharedIn.replace("{count}", String(bubbleCount))}
                            </span>
                          </>
                        )}
                      </div>
                      {bubbleCount > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {wishlist.bubbles.slice(0, 3).map((bw) => (
                            <button
                              key={bw.bubble.id}
                              onClick={(e) => handleBubbleClick(bw.bubble.id, e)}
                              className="text-xs bg-muted px-2 py-1 rounded-full hover:bg-muted/80 transition-colors"
                            >
                              {bw.bubble.name}
                            </button>
                          ))}
                          {bubbleCount > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{bubbleCount - 3} {labels.more}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {wishlist.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <WishlistDetailPanel
        wishlistId={selectedWishlistId}
        open={wishlistPanelOpen}
        onOpenChange={setWishlistPanelOpen}
        onNavigateToUser={handleNavigateToUser}
        onNavigateToBubble={handleNavigateToBubble}
        onNavigateToItem={handleNavigateToItem}
      />

      <UserDetailPanel
        userId={selectedUserId}
        open={userPanelOpen}
        onOpenChange={setUserPanelOpen}
        onNavigateToBubble={handleNavigateToBubble}
      />

      <BubbleDetailPanel
        bubbleId={selectedBubbleId}
        open={bubblePanelOpen}
        onOpenChange={setBubblePanelOpen}
        onNavigateToUser={handleNavigateToUser}
      />

      <ItemDetailPanel
        itemId={selectedItemId}
        open={itemPanelOpen}
        onOpenChange={setItemPanelOpen}
        onNavigateToUser={handleNavigateToUser}
        onNavigateToWishlist={handleNavigateToWishlist}
        onNavigateToBubble={handleNavigateToBubble}
      />
    </>
  );
}
