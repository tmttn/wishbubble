import {
  GuestWishlist,
  GuestWishlistItem,
  GUEST_WISHLIST_KEY,
  GUEST_WISHLIST_TTL_DAYS,
} from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

// --- Store subscription for useSyncExternalStore ---
// Listeners are notified whenever the guest wishlist is mutated from this tab.
const listeners = new Set<() => void>();

export function subscribeGuestWishlist(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function emitChange() {
  listeners.forEach((l) => l());
}

// --- Snapshot caching for referential stability ---
// useSyncExternalStore compares snapshots with Object.is, so we must return
// the same reference when the underlying data hasn't changed.
let _cachedRaw: string | null | undefined = undefined;
let _cachedParsed: GuestWishlist | null = null;

export function getGuestWishlistSnapshot(): GuestWishlist | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (raw === _cachedRaw) return _cachedParsed;

    _cachedRaw = raw;
    if (!raw) {
      _cachedParsed = null;
      return null;
    }

    const wishlist = JSON.parse(raw) as GuestWishlist;
    if (isGuestWishlistExpired(wishlist)) {
      clearGuestWishlist();
      _cachedParsed = null;
      _cachedRaw = null;
      return null;
    }

    _cachedParsed = wishlist;
    return wishlist;
  } catch {
    _cachedParsed = null;
    return null;
  }
}

export function getGuestWishlist(): GuestWishlist | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!stored) return null;

    const wishlist = JSON.parse(stored) as GuestWishlist;

    // Check if expired
    if (isGuestWishlistExpired(wishlist)) {
      clearGuestWishlist();
      return null;
    }

    return wishlist;
  } catch {
    return null;
  }
}

export function setGuestWishlist(wishlist: GuestWishlist): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
    // Invalidate cache so the next snapshot read picks up the new value
    _cachedRaw = undefined;
    emitChange();
  } catch (error) {
    console.error("Failed to save guest wishlist:", error);
  }
}

export function clearGuestWishlist(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
    _cachedRaw = undefined;
    emitChange();
  } catch (error) {
    console.error("Failed to clear guest wishlist:", error);
  }
}

export function isGuestWishlistExpired(wishlist: GuestWishlist): boolean {
  const expiresAt = new Date(wishlist.expiresAt);
  return expiresAt < new Date();
}

export function createNewGuestWishlist(): GuestWishlist {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + GUEST_WISHLIST_TTL_DAYS * 24 * 60 * 60 * 1000);

  return {
    id: generateId(),
    name: "My Wishlist",
    items: [],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function addItemToGuestWishlist(item: Omit<GuestWishlistItem, "id" | "createdAt">): GuestWishlist {
  let wishlist = getGuestWishlist();

  if (!wishlist) {
    wishlist = createNewGuestWishlist();
  }

  const newItem: GuestWishlistItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  wishlist.items.push(newItem);
  setGuestWishlist(wishlist);

  return wishlist;
}

export function updateItemInGuestWishlist(
  itemId: string,
  updates: Partial<Omit<GuestWishlistItem, "id" | "createdAt">>
): GuestWishlist | null {
  const wishlist = getGuestWishlist();

  if (!wishlist) return null;

  const itemIndex = wishlist.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return wishlist;

  wishlist.items[itemIndex] = {
    ...wishlist.items[itemIndex],
    ...updates,
  };

  setGuestWishlist(wishlist);
  return wishlist;
}

export function removeItemFromGuestWishlist(itemId: string): GuestWishlist | null {
  const wishlist = getGuestWishlist();

  if (!wishlist) return null;

  wishlist.items = wishlist.items.filter((item) => item.id !== itemId);
  setGuestWishlist(wishlist);

  return wishlist;
}

export function getDaysUntilExpiration(wishlist: GuestWishlist): number {
  const expiresAt = new Date(wishlist.expiresAt);
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
