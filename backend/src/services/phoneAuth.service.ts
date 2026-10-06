import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.ts";
import { getAuthUidByPhone, upsertUserProfile, type ProfileInput } from "./user.service.ts";

const noSession = { auth: { autoRefreshToken: false, persistSession: false } };

// Built lazily (only once both keys are known to be set) so importing this
// module never crashes a boot/test run that has no phone-login config —
// createClient() throws synchronously on an empty key.
let clients: {
  admin: ReturnType<typeof createClient>;
  anon: ReturnType<typeof createClient>;
} | null = null;
function getClients() {
  if (!clients) {
    clients = {
      admin: createClient(env.supabaseUrl, env.supabaseServiceRoleKey, noSession),
      anon: createClient(env.supabaseUrl, env.supabaseAnonKey, noSession),
    };
  }
  return clients;
}

const toE164 = (phone: string) => `+${phone.replace(/\D/g, "")}`;

/**
 * Mint a real Supabase session for a phone number our own OTP flow has
 * already verified (see routes/otp.routes.ts). Reuses the Supabase auth user
 * already on file for this phone (matched via our own `users` table) or
 * creates one; a random one-time password gets the session through the
 * standard password grant and is then thrown away — nothing persists it.
 */
export async function signInWithVerifiedPhone(
  phone: string,
  profile?: Pick<ProfileInput, "firstName" | "lastName" | "email">,
) {
  if (!env.supabaseServiceRoleKey || !env.supabaseAnonKey) {
    throw new Error("Phone login is not fully configured on the server");
  }
  const { admin, anon } = getClients();

  const e164 = toE164(phone);
  const oneTimePassword = randomBytes(24).toString("base64url");
  let authUid = await getAuthUidByPhone(phone);

  if (authUid) {
    const { error } = await admin.auth.admin.updateUserById(authUid, { password: oneTimePassword });
    if (error) throw new Error(`Failed to prepare sign-in: ${error.message}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      phone: e164,
      phone_confirm: true,
      password: oneTimePassword,
    });
    if (error) throw new Error(`Failed to create account: ${error.message}`);
    authUid = data.user.id;
  }

  // Register.tsx collects a name/email the Supabase phone identity itself has
  // no room for; write it straight to our own `users` row (only the fields
  // actually supplied are touched, so a bare phone login never wipes it).
  if (profile?.firstName || profile?.lastName || profile?.email) {
    await upsertUserProfile(authUid, { phone, ...profile });
  }

  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    phone: e164,
    password: oneTimePassword,
  });
  if (signInError || !signIn.session) {
    throw new Error(`Failed to sign in: ${signInError?.message ?? "no session returned"}`);
  }

  return {
    accessToken: signIn.session.access_token,
    refreshToken: signIn.session.refresh_token,
  };
}
