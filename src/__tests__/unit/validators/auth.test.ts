import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  guestWishlistItemSchema,
  registerWithGuestWishlistSchema,
} from "@/lib/validators/auth";

describe("Auth Validators", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should trim and lowercase email", () => {
      const data = {
        email: "  TEST@Example.COM  ",
        password: "password123",
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });
  });

  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject password without uppercase letter", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject password without lowercase letter", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject password without number", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Passworddd",
        confirmPassword: "Passworddd",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject mismatched passwords", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("confirmPassword");
      }
    });

    it("should trim name and lowercase email", () => {
      const data = {
        name: "  John Doe  ",
        email: "  JOHN@Example.COM  ",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John Doe");
        expect(result.data.email).toBe("john@example.com");
      }
    });

    it("should reject name that becomes too short after trimming", () => {
      const data = {
        name: "  J  ", // After trim: "J" (1 char < 2 min)
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("guestWishlistItemSchema", () => {
    it("should validate minimal guest item", () => {
      const validData = {
        title: "Test Item",
      };

      const result = guestWishlistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("EUR");
        expect(result.data.priority).toBe("NICE_TO_HAVE");
        expect(result.data.quantity).toBe(1);
      }
    });

    it("should validate complete guest item", () => {
      const validData = {
        title: "Nintendo Switch",
        description: "Gaming console",
        price: 299.99,
        priceMax: 349.99,
        currency: "USD",
        url: "https://example.com/switch",
        imageUrl: "https://example.com/image.jpg",
        priority: "MUST_HAVE" as const,
        quantity: 1,
        notes: "Any color is fine",
      };

      const result = guestWishlistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
      };

      const result = guestWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid priority", () => {
      const invalidData = {
        title: "Test",
        priority: "INVALID",
      };

      const result = guestWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject quantity less than 1", () => {
      const invalidData = {
        title: "Test",
        quantity: 0,
      };

      const result = guestWishlistItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("registerWithGuestWishlistSchema", () => {
    it("should validate registration with guest wishlist items", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        guestWishlistItems: [
          { title: "Item 1" },
          { title: "Item 2", price: 50 },
        ],
      };

      const result = registerWithGuestWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate registration without guest wishlist items", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerWithGuestWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid guest wishlist items", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        guestWishlistItems: [{ title: "" }], // Empty title
      };

      const result = registerWithGuestWishlistSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
