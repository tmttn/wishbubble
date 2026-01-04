export interface GuestWishlistItem {
  id: string;
  title: string;
  description?: string;
  price?: number;
  priceMax?: number;
  currency: string;
  url?: string;
  imageUrl?: string;
  priority: "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM";
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface GuestWishlist {
  id: string;
  name: string;
  items: GuestWishlistItem[];
  createdAt: string;
  expiresAt: string;
}

export const GUEST_WISHLIST_KEY = "wishbubble_guest_wishlist";
export const GUEST_WISHLIST_TTL_DAYS = 7;
