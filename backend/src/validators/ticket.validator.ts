import { z } from "zod";

/**
 * What a client may say about a purchase. Price, title and availability are
 * deliberately NOT accepted: the server derives them from the database.
 */
export const createTicketBody = z.object({
  eventId: z.union([z.string(), z.number()]).transform(String),
  tierId: z.union([z.string(), z.number()]).transform(String),
  tierName: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(50),
  selectedDate: z.string().optional(),
  selectedTime: z.string().optional(),
  paymentTxnId: z.string().min(1).optional(),
});

export type CreateTicketBody = z.infer<typeof createTicketBody>;
