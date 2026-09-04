import { z } from "zod";

export const createTicketBody = z.object({
  eventId: z.union([z.string(), z.number()]).transform(String),
  eventTitle: z.string().min(1),
  tierId: z.union([z.string(), z.number()]).transform(String),
  tierName: z.string().min(1),
  price: z.coerce.number().nonnegative().default(0),
  quantity: z.coerce.number().int().min(1).max(50),
  selectedDate: z.string().optional(),
  selectedTime: z.string().optional(),
});

export type CreateTicketBody = z.infer<typeof createTicketBody>;
