import { z } from "zod";

export const resolveMapQuery = z.object({
  url: z
    .string()
    .url()
    .refine(
      (u) => u.includes("goo.gl") || u.includes("google.com") || u.includes("maps"),
      "URL must be a Google Maps link",
    ),
});
