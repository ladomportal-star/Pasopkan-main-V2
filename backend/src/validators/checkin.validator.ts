import { z } from "zod";

export const createCheckinBody = z.object({
  ticketCode: z.string().min(1),
  eventId: z.union([z.string(), z.number()]).transform(String),
  attendeeName: z.string().optional(),
  ticketType: z.string().optional(),
  seatLabel: z.string().optional(),
  gate: z.string().optional(),
  note: z.string().optional(),
});

export const listCheckinsQuery = z.object({
  eventId: z.string().min(1),
});

export type CreateCheckinBody = z.infer<typeof createCheckinBody>;
