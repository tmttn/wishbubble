import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
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
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().optional(),
  priceMax: z.number().optional(),
  currency: z.string().default("EUR"),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  priority: z.enum(["MUST_HAVE", "NICE_TO_HAVE", "DREAM"]).default("NICE_TO_HAVE"),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export const registerWithGuestWishlistSchema = registerSchema.and(
  z.object({
    guestWishlistItems: z.array(guestWishlistItemSchema).optional(),
  })
);

export type GuestWishlistItem = z.infer<typeof guestWishlistItemSchema>;
export type RegisterWithGuestWishlistInput = z.infer<typeof registerWithGuestWishlistSchema>;
