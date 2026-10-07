import { z } from "zod";
import { isLaoMobilePhone, normalizeLaoMobilePhone } from "../utils/phone.ts";

const laoPhone = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeLaoMobilePhone)
  .refine(isLaoMobilePhone, "Use a Lao mobile number such as 020 5555 5555");

export const sendOtpBody = z.object({
  phone: laoPhone,
  captchaToken: z.string().trim().min(1).max(4096).optional(),
});

export const verifyOtpBody = z.object({
  phone: laoPhone,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must contain 6 digits"),
});
