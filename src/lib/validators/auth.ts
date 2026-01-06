import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Guest wishlist item schema for transfer during registration
export const guestWishlistItemSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  price: z.number().optional(),
  priceMax: z.number().optional(),
  currency: z.string().trim().default("EUR"),
  url: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  priority: z.enum(["MUST_HAVE", "NICE_TO_HAVE", "DREAM"]).default("NICE_TO_HAVE"),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().trim().optional(),
});

export const registerWithGuestWishlistSchema = registerSchema.and(
  z.object({
    guestWishlistItems: z.array(guestWishlistItemSchema).optional(),
  })
);

export type GuestWishlistItem = z.infer<typeof guestWishlistItemSchema>;
export type RegisterWithGuestWishlistInput = z.infer<typeof registerWithGuestWishlistSchema>;
