import { z } from "zod";

/** Profile sync accepts editable profile fields only; auth identifiers come from the signed token. */
export const syncAccountBody = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().max(10).optional(), // YYYY-MM-DD
  avatarUrl: z.string().optional(),
});

export type SyncAccountBody = z.infer<typeof syncAccountBody>;
