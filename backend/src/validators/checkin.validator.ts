import { z } from "zod";

export const createCheckinBody = z.object({
  ticketCode: z.string().trim().min(1).max(200),
  eventId: z.string().uuid(),
  attendeeName: z.string().optional(),
  ticketType: z.string().optional(),
  seatLabel: z.string().optional(),
  gate: z.string().optional(),
  note: z.string().optional(),
});

export const listCheckinsQuery = z.object({
  eventId: z.string().uuid(),
});

export type CreateCheckinBody = z.infer<typeof createCheckinBody>;
