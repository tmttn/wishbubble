import { z } from "zod";

export const occasionTypes = [
  "CHRISTMAS",
  "BIRTHDAY",
  "SINTERKLAAS",
  "WEDDING",
  "BABY_SHOWER",
  "GRADUATION",
  "HOUSEWARMING",
  "OTHER",
] as const;

export const createBubbleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  occasionType: z.enum(occasionTypes, {
    error: "Please select an occasion",
  }),
  eventDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => {
      if (!val || val === "") return undefined;
      if (val instanceof Date) return val;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  currency: z.string().trim().optional().default("EUR"),
  isSecretSanta: z.boolean().optional().default(false),
  maxMembers: z.coerce.number().min(2).max(100).optional().default(10),
  allowMemberWishlists: z.boolean().optional().default(true),
});

export const updateBubbleSchema = createBubbleSchema.partial();

export const inviteMembersSchema = z.object({
  emails: z.array(z.string().trim().toLowerCase().email()).min(1, "At least one email is required"),
});

export type CreateBubbleInput = z.input<typeof createBubbleSchema>;
export type CreateBubbleOutput = z.output<typeof createBubbleSchema>;
export type UpdateBubbleInput = z.infer<typeof updateBubbleSchema>;
export type InviteMembersInput = z.infer<typeof inviteMembersSchema>;
