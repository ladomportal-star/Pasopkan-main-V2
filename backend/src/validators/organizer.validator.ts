import { z } from "zod";

export const organizerAttendeesParams = z.object({ eventId: z.string().uuid() });
export const organizerAttendeesQuery = z.object({
  q: z.string().trim().max(120).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type OrganizerAttendeesQuery = z.infer<typeof organizerAttendeesQuery>;
