import { z } from "zod";

export const notificationPreferencesBody = z
  .object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    systemUpdatesEnabled: z.boolean(),
    eventStatusEnabled: z.boolean(),
    refundsEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
  })
  .strict();
