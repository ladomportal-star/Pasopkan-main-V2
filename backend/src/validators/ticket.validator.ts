import { z } from "zod";

/**
 * What a client may say about a purchase. Price, title and availability are
 * deliberately NOT accepted: the server derives them from the database.
 */
const attendee = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  customAnswers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
});

export const createTicketBody = z.object({
  eventId: z.union([z.string(), z.number()]).transform(String),
  tierId: z.union([z.string(), z.number()]).transform(String),
  tierName: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(50),
  selectedDate: z.string().optional(),
  selectedTime: z.string().optional(),
  paymentTxnId: z.string().min(1).optional(),
  /** One entry per ticket (i.e. per unit of `quantity`), in order. Optional. */
  attendees: z.array(attendee).max(50).optional(),
});

export type CreateTicketBody = z.infer<typeof createTicketBody>;
