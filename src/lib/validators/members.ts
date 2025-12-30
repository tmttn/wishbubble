import { z } from "zod";

export const changeRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "New owner ID is required"),
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
