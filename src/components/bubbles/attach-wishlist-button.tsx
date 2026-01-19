"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Star, Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Wishlist {
  id: string;
  name: string;
  isDefault: boolean;
  _count: { items: number };
}

interface AttachWishlistButtonProps {
  bubbleId: string;
  label: string;
  successMessage: string;
  createSuccessMessage?: string;
  errorMessage: string;
  attachedWishlistIds?: string[];
  selectLabel?: string;
  alreadyAttachedLabel?: string;
  selectDescription?: string;
  allAttachedMessage?: string;
  createNewLabel?: string;
  createNewPlaceholder?: string;
}

export function AttachWishlistButton({
  bubbleId,
  label,
  successMessage,
  createSuccessMessage,
  errorMessage,
  attachedWishlistIds = [],
  selectLabel = "Select a wishlist",
  alreadyAttachedLabel = "Already shared",
  selectDescription = "Choose which wishlist you want to share with this group.",
  allAttachedMessage = "All your wishlists are already shared with this group.",
  createNewLabel = "Create new list",
  createNewPlaceholder = "New list name",
}: AttachWishlistButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [fetchingWishlists, setFetchingWishlists] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Fetch user's wishlists
  const fetchWishlists = async () => {
    setFetchingWishlists(true);
    try {
      const response = await fetch("/api/wishlists");
      if (response.ok) {
        const data = await response.json();
        return data.wishlists as Wishlist[];
      }
      return [];
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "AttachWishlistButton", action: "fetchWishlists" } });
      return [];
    } finally {
      setFetchingWishlists(false);
    }
  };

  const handleAttach = async (wishlistId?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/attach-wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to attach wishlist");
      }

      toast.success(successMessage);
      setShowDialog(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndAttach = async () => {
    if (!newListName.trim()) return;

    setIsLoading(true);
    try {
      // Create new wishlist
      const createResponse = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });

      const wishlist = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(wishlist.error || "Failed to create wishlist");
      }

      // Attach the new wishlist to the bubble
      const attachResponse = await fetch(`/api/bubbles/${bubbleId}/attach-wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistId: wishlist.id }),
      });

      if (!attachResponse.ok) {
        const attachData = await attachResponse.json();
        throw new Error(attachData.error || "Failed to attach wishlist");
      }

      toast.success(createSuccessMessage || successMessage);
      setShowDialog(false);
      setShowCreateNew(false);
      setNewListName("");

      // Navigate to the wishlist page to add wishes
      router.push("/wishlist?add=true");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = async () => {
    const fetchedWishlists = await fetchWishlists();
    setWishlists(fetchedWishlists);

    if (fetchedWishlists.length === 0) {
      // No wishlists yet - attach will create default
      handleAttach();
    } else if (fetchedWishlists.length === 1) {
      // Only one wishlist - attach it directly if not already attached
      const wishlist = fetchedWishlists[0];
      if (!attachedWishlistIds.includes(wishlist.id)) {
        handleAttach(wishlist.id);
      } else {
        // Already attached - show dialog so user can create a new list
        setShowDialog(true);
      }
    } else {
      // Multiple wishlists - show dialog
      setShowDialog(true);
    }
  };

  // Filter to show only wishlists not already attached
  const availableWishlists = wishlists.filter(
    (w) => !attachedWishlistIds.includes(w.id)
  );
  const attachedWishlists = wishlists.filter((w) =>
    attachedWishlistIds.includes(w.id)
  );

  return (
    <>
      <Button size="sm" onClick={handleButtonClick} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectLabel}</DialogTitle>
            <DialogDescription>{selectDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {fetchingWishlists ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {availableWishlists.length === 0 && !showCreateNew ? (
                  <p className="text-center text-muted-foreground py-4">
                    {allAttachedMessage}
                  </p>
                ) : (
                  availableWishlists.map((wishlist) => (
                    <button
                      key={wishlist.id}
                      onClick={() => handleAttach(wishlist.id)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wishlist.name}</span>
                        {wishlist.isDefault && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {wishlist._count.items} items
                      </span>
                    </button>
                  ))
                )}

                {/* Show already attached wishlists greyed out */}
                {attachedWishlists.map((wishlist) => (
                  <div
                    key={wishlist.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-muted/30 opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{wishlist.name}</span>
                      {wishlist.isDefault && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4" />
                      {alreadyAttachedLabel}
                    </div>
                  </div>
                ))}

                {/* Create new list section */}
                {showCreateNew ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder={createNewPlaceholder}
                      className="flex-1 h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newListName.trim()) {
                          handleCreateAndAttach();
                        } else if (e.key === "Escape") {
                          setShowCreateNew(false);
                          setNewListName("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateAndAttach}
                      disabled={isLoading || !newListName.trim()}
                      className="h-8"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{createNewLabel}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
