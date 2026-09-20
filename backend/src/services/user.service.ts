import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { users } from "../models/schema.ts";

export interface ProfileInput {
  email?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
}

/** Ensure a `users` row exists for this identity (no profile fields touched beyond email). */
export async function getOrCreateUser(uid: string, email?: string) {
  return upsertUserProfile(uid, { email });
}

/**
 * Upsert the user row keyed by the identity provider's user id (stored in
 * `firebase_uid` for historical reasons — it now holds the Supabase Auth `sub`).
 * Only fields the caller actually supplied are written, so a partial sync
 * never wipes data that is already stored.
 */
export async function upsertUserProfile(uid: string, profile: ProfileInput) {
  const patch = {
    ...(profile.email && { email: profile.email }),
    ...(profile.displayName !== undefined && { displayName: profile.displayName }),
    ...(profile.phone !== undefined && { phone: profile.phone }),
    ...(profile.avatarUrl !== undefined && { avatarUrl: profile.avatarUrl }),
  };

  const [row] = await db
    .insert(users)
    .values({ firebaseUid: uid, email: profile.email ?? "", ...patch })
    .onConflictDoUpdate({
      target: users.firebaseUid,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();

  return row;
}

/** The user's application role ("user" | "organizer" | "admin"); "user" if unknown. */
export async function getUserRole(uid: string, exec: Pick<typeof db, "select"> = db) {
  const [row] = await exec
    .select({ role: users.role })
    .from(users)
    .where(eq(users.firebaseUid, uid))
    .limit(1);
  return row?.role ?? "user";
}
