import { z } from "zod";

/** Profile sync — email is required; the rest are filled in as the user
 *  completes their profile. */
export const syncAccountBody = z.object({
  email: z.string().email(),
  displayName: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  avatarUrl: z.string().optional(),
});

export type SyncAccountBody = z.infer<typeof syncAccountBody>;
