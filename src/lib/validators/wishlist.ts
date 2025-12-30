import { z } from "zod";

export const itemPriorities = ["MUST_HAVE", "NICE_TO_HAVE", "DREAM"] as const;

export const createWishlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const updateWishlistSchema = createWishlistSchema.partial();

export const createWishlistItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  currency: z.string().optional().default("EUR"),
  url: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  priority: z.enum(itemPriorities).optional().default("NICE_TO_HAVE"),
  quantity: z.coerce.number().min(1).optional().default(1),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const updateWishlistItemSchema = createWishlistItemSchema.partial();

export const reorderItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number(),
    })
  ),
});

// Alias for the add item form (used in wishlist page)
export const addItemSchema = createWishlistItemSchema;

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
export type CreateWishlistItemInput = z.input<typeof createWishlistItemSchema>;
export type UpdateWishlistItemInput = z.infer<typeof updateWishlistItemSchema>;
export type AddItemInput = z.input<typeof addItemSchema>;
