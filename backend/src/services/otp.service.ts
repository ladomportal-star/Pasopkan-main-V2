import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.ts";
import { HttpError } from "../middlewares/error.middleware.ts";

let client: ReturnType<typeof createClient> | undefined;

function phoneAuthClient() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new HttpError(503, "Phone sign-in is not configured");
  }
  client ??= createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}

function providerError(error: { status?: number }, action: "send" | "verify"): never {
  if (error.status === 429) {
    throw new HttpError(429, "Too many OTP attempts. Please wait and try again");
  }
  if (action === "verify") {
    throw new HttpError(400, "Invalid or expired verification code");
  }
  if (error.status && error.status >= 500) {
    throw new HttpError(503, "SMS service is temporarily unavailable");
  }
  throw new HttpError(400, "Could not send verification code");
}

export async function sendPhoneOtp(phone: string, captchaToken?: string) {
  const { error } = await phoneAuthClient().auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true, captchaToken },
  });
  if (error) providerError(error, "send");
}

export async function verifyPhoneOtp(phone: string, code: string) {
  const { data, error } = await phoneAuthClient().auth.verifyOtp({
    phone,
    token: code,
    type: "sms",
  });
  if (error) providerError(error, "verify");
  if (!data.session) throw new HttpError(400, "Verification did not create a session");

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  };
}
