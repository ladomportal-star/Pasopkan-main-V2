import { z } from "zod";

export const syncAccountBody = z.object({
  email: z.string().email(),
});
