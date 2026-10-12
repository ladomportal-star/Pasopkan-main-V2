import { z } from "zod";
import { env } from "../config/env.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { isLaoMobilePhone, normalizeLaoMobilePhone } from "../utils/phone.ts";

const authUser = z.object({
  id: z.string(),
  phone: z.string().nullish(),
  phone_confirmed_at: z.string().nullish(),
});

/** Read the confirmed phone from Supabase Auth, never from editable profile data. */
export async function getVerifiedPhone(uid: string): Promise<string | null> {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey)
    throw new HttpError(503, "Phone verification is not configured");
  let result: z.infer<typeof authUser>;
  try {
    const response = await fetch(
      `${env.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(uid)}`,
      {
        headers: {
          apikey: env.supabaseServiceRoleKey,
          Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error(`Supabase Auth returned ${response.status}`);
    const payload = (await response.json()) as { user?: unknown };
    result = authUser.parse(payload.user ?? payload);
  } catch {
    throw new HttpError(503, "Could not confirm phone verification");
  }
  if (result.id !== uid) throw new HttpError(503, "Could not confirm phone verification");
  if (!result.phone || !result.phone_confirmed_at) return null;
  const phone = normalizeLaoMobilePhone(result.phone);
  return isLaoMobilePhone(phone) ? phone : null;
}

export async function requireVerifiedPhone(uid: string): Promise<string> {
  const phone = await getVerifiedPhone(uid);
  if (!phone) throw new HttpError(403, "Verify your Lao mobile number with OTP first");
  return phone;
}
