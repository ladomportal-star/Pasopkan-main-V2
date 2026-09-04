import { z } from "zod";

export const eventIdParam = z.object({
  eventId: z.string().min(1),
});

export const createReviewBody = z.object({
  eventId: z.union([z.string(), z.number()]).transform(String),
  userName: z.string().optional(),
  userRealName: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  // Free-text comment or a serialized JSON object of answers
  comment: z.union([z.string().min(1), z.record(z.string(), z.unknown())]),
  date: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type CreateReviewBody = z.infer<typeof createReviewBody>;
