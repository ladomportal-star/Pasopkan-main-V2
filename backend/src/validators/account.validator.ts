import { z } from "zod";

/** Profile sync — every field optional; email falls back to the verified token's. */
export const syncAccountBody = z.object({
  email: z.string().email().optional(),
  displayName: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  avatarUrl: z.string().optional(),
});

export type SyncAccountBody = z.infer<typeof syncAccountBody>;
