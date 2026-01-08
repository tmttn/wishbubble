"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import {
  GuestWishlist,
  GuestWishlistItem,
} from "./types";
import {
  getGuestWishlist,
  setGuestWishlist,
  clearGuestWishlist,
  createNewGuestWishlist,
  addItemToGuestWishlist,
  updateItemInGuestWishlist,
  removeItemFromGuestWishlist,
  getDaysUntilExpiration,
  isGuestWishlistExpired,
} from "./storage";

// Subscription for useSyncExternalStore - storage doesn't emit events so we just need a no-op
const emptySubscribe = () => () => {};
const getServerSnapshot = (): GuestWishlist | null => null;

export function useGuestWishlist() {
  // Use useSyncExternalStore for initial load to avoid setState in useEffect
  const initialWishlist = useSyncExternalStore(
    emptySubscribe,
    getGuestWishlist,
    getServerSnapshot
  );
  const [wishlist, setWishlistState] = useState<GuestWishlist | null>(initialWishlist);
  // Loading is false on client since useSyncExternalStore handles hydration
  const isLoading = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true
  );

  const addItem = useCallback(
    (item: Omit<GuestWishlistItem, "id" | "createdAt">) => {
      const updated = addItemToGuestWishlist(item);
      setWishlistState(updated);
      return updated;
    },
    []
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<Omit<GuestWishlistItem, "id" | "createdAt">>) => {
      const updated = updateItemInGuestWishlist(itemId, updates);
      setWishlistState(updated);
      return updated;
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    const updated = removeItemFromGuestWishlist(itemId);
    setWishlistState(updated);
    return updated;
  }, []);

  const clear = useCallback(() => {
    clearGuestWishlist();
    setWishlistState(null);
  }, []);

  const createNew = useCallback(() => {
    const newWishlist = createNewGuestWishlist();
    setGuestWishlist(newWishlist);
    setWishlistState(newWishlist);
    return newWishlist;
  }, []);

  const daysRemaining = wishlist ? getDaysUntilExpiration(wishlist) : 0;
  const isExpired = wishlist ? isGuestWishlistExpired(wishlist) : false;
  const itemCount = wishlist?.items.length || 0;

  return {
    wishlist,
    isLoading,
    addItem,
    updateItem,
    removeItem,
    clear,
    createNew,
    daysRemaining,
    isExpired,
    itemCount,
    hasWishlist: !!wishlist && !isExpired && itemCount > 0,
  };
}

export function useGuestWishlistTransfer() {
  const { wishlist, clear } = useGuestWishlist();

  const getItemsForTransfer = useCallback(() => {
    if (!wishlist) return [];

    return wishlist.items.map((item) => ({
      title: item.title,
      description: item.description,
      price: item.price,
      priceMax: item.priceMax,
      currency: item.currency,
      url: item.url,
      imageUrl: item.imageUrl,
      priority: item.priority,
      quantity: item.quantity,
      notes: item.notes,
    }));
  }, [wishlist]);

  const transferToAccount = useCallback(async () => {
    if (!wishlist || wishlist.items.length === 0) return { success: false };

    try {
      const response = await fetch("/api/guest/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: getItemsForTransfer(),
        }),
      });

      if (response.ok) {
        clear();
        return { success: true };
      }

      return { success: false };
    } catch {
      return { success: false };
    }
  }, [wishlist, getItemsForTransfer, clear]);

  return {
    wishlist,
    hasItemsToTransfer: !!wishlist && wishlist.items.length > 0,
    getItemsForTransfer,
    transferToAccount,
    clearGuestWishlist: clear,
  };
}
