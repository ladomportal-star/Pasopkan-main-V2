import { z } from "zod";

/** Profile sync — every field optional; email falls back to the verified token's. */
export const syncAccountBody = z.object({
  email: z.string().email().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(40).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().max(10).optional(), // YYYY-MM-DD
  avatarUrl: z.string().optional(),
});

export type SyncAccountBody = z.infer<typeof syncAccountBody>;
