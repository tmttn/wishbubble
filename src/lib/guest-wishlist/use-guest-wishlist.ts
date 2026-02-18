"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  GuestWishlist,
  GuestWishlistItem,
} from "./types";
import {
  getGuestWishlistSnapshot,
  subscribeGuestWishlist,
  setGuestWishlist,
  clearGuestWishlist,
  createNewGuestWishlist,
  addItemToGuestWishlist,
  updateItemInGuestWishlist,
  removeItemFromGuestWishlist,
  getDaysUntilExpiration,
  isGuestWishlistExpired,
} from "./storage";

const getServerSnapshot = (): GuestWishlist | null => null;

export function useGuestWishlist() {
  const wishlist = useSyncExternalStore(
    subscribeGuestWishlist,
    getGuestWishlistSnapshot,
    getServerSnapshot
  );

  // On the server, isLoading is true (no localStorage). On the client, the snapshot
  // is available synchronously so isLoading is always false.
  const isLoading = useSyncExternalStore(
    subscribeGuestWishlist,
    () => false,
    () => true
  );

  const addItem = useCallback(
    (item: Omit<GuestWishlistItem, "id" | "createdAt">) => {
      return addItemToGuestWishlist(item);
    },
    []
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<Omit<GuestWishlistItem, "id" | "createdAt">>) => {
      return updateItemInGuestWishlist(itemId, updates);
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    return removeItemFromGuestWishlist(itemId);
  }, []);

  const clear = useCallback(() => {
    clearGuestWishlist();
  }, []);

  const createNew = useCallback(() => {
    const newWishlist = createNewGuestWishlist();
    setGuestWishlist(newWishlist);
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
