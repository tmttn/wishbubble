import { describe, it, expect } from "vitest";
import {
  createWishlistSchema,
  updateWishlistSchema,
  createWishlistItemSchema,
  updateWishlistItemSchema,
  reorderItemsSchema,
  itemPriorities,
} from "@/lib/validators/wishlist";

describe("Wishlist Validators", () => {
  describe("createWishlistSchema", () => {
    it("should validate minimal wishlist data", () => {
      const validData = {
        name: "My Birthday Wishlist",
      };

      const result = createWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate wishlist with description", () => {
      const validData = {
        name: "Christmas Wishlist",
        description: "Things I would love to receive this Christmas",
      };

      const result = createWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const invalidData = {
        name: "",
      };

      const result = createWishlistSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Name is required");
      }
    });

    it("should reject name longer than 100 characters", () => {
      const invalidData = {
        name: "X".repeat(101),
      };

      const result = createWishlistSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject description longer than 500 characters", () => {
      const invalidData = {
        name: "Valid Name",
        description: "X".repeat(501),
      };

      const result = createWishlistSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateWishlistSchema", () => {
    it("should allow partial updates", () => {
      const partialData = {
        description: "Updated description",
      };

      const result = updateWishlistSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("should allow empty object", () => {
      const result = updateWishlistSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("createWishlistItemSchema", () => {
    it("should validate minimal item", () => {
      const validData = {
        title: "PlayStation 5",
      };

      const result = createWishlistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("EUR");
        expect(result.data.priority).toBe("NICE_TO_HAVE");
        expect(result.data.quantity).toBe(1);
      }
    });

    it("should validate complete item", () => {
      const validData = {
        title: "PlayStation 5",
        description: "Next-gen gaming console",
        price: 499.99,
        priceMax: 549.99,
        currency: "USD",
        url: "https://store.playstation.com/ps5",
        imageUrl: "https://example.com/ps5.jpg",
        uploadedImage: "https://blob.vercel.com/image123.jpg",
        priority: "MUST_HAVE" as const,
        quantity: 1,
        category: "Electronics",
        notes: "Disc edition preferred",
        wishlistId: "wishlist-123",
      };

      const result = createWishlistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Title is required");
      }
    });

    it("should reject title longer than 200 characters", () => {
      const invalidData = {
        title: "X".repeat(201),
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject description longer than 1000 characters", () => {
      const invalidData = {
        title: "Valid Title",
        description: "X".repeat(1001),
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept all valid priorities", () => {
      itemPriorities.forEach((priority) => {
        const validData = {
          title: `Item with ${priority} priority`,
          priority,
        };

        const result = createWishlistItemSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid priority", () => {
      const invalidData = {
        title: "Test Item",
        priority: "SUPER_IMPORTANT",
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative price", () => {
      const invalidData = {
        title: "Test Item",
        price: -10,
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject quantity less than 1", () => {
      const invalidData = {
        title: "Test Item",
        quantity: 0,
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should coerce string numbers for price and quantity", () => {
      const validData = {
        title: "Test Item",
        price: "99.99" as unknown as number,
        quantity: "2" as unknown as number,
      };

      const result = createWishlistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(99.99);
        expect(result.data.quantity).toBe(2);
      }
    });

    it("should accept empty string for optional URL fields", () => {
      const validData = {
        title: "Test Item",
        url: "",
        imageUrl: "",
        uploadedImage: "",
      };

      const result = createWishlistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid URL", () => {
      const invalidData = {
        title: "Test Item",
        url: "not-a-valid-url",
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept valid URL", () => {
      const validData = {
        title: "Test Item",
        url: "https://example.com/product",
      };

      const result = createWishlistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject category longer than 50 characters", () => {
      const invalidData = {
        title: "Test Item",
        category: "X".repeat(51),
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject notes longer than 500 characters", () => {
      const invalidData = {
        title: "Test Item",
        notes: "X".repeat(501),
      };

      const result = createWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateWishlistItemSchema", () => {
    it("should allow partial updates", () => {
      const partialData = {
        price: 299.99,
        priority: "MUST_HAVE" as const,
      };

      const result = updateWishlistItemSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("should allow empty object", () => {
      const result = updateWishlistItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate fields when provided", () => {
      const invalidData = {
        price: -50, // Invalid negative price
      };

      const result = updateWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("reorderItemsSchema", () => {
    it("should validate reorder data", () => {
      const validData = {
        items: [
          { id: "item-1", sortOrder: 0 },
          { id: "item-2", sortOrder: 1 },
          { id: "item-3", sortOrder: 2 },
        ],
      };

      const result = reorderItemsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept empty items array", () => {
      const validData = {
        items: [],
      };

      const result = reorderItemsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject items without id", () => {
      const invalidData = {
        items: [{ sortOrder: 0 }],
      };

      const result = reorderItemsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject items without sortOrder", () => {
      const invalidData = {
        items: [{ id: "item-1" }],
      };

      const result = reorderItemsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept negative sortOrder", () => {
      const validData = {
        items: [{ id: "item-1", sortOrder: -1 }],
      };

      const result = reorderItemsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
