import { z } from "zod";

// Webhook payloads vary a lot between gateways — accept any object, the
// service extracts the fields it knows.
export const webhookBody = z.record(z.string(), z.unknown());

export const transactionIdParam = z.object({
  transactionId: z.string().min(1),
});
