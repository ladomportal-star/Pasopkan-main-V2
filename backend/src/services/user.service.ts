import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { users } from "../models/schema.ts";

export interface ProfileInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  avatarUrl?: string;
}

/** Ensure a `users` row exists for this identity (no profile fields touched beyond email). */
export async function getOrCreateUser(uid: string, email?: string) {
  return upsertUserProfile(uid, { email });
}

// Only fields the caller actually supplied are written, so a partial sync never wipes stored data.
export async function upsertUserProfile(uid: string, profile: ProfileInput) {
  const patch = {
    ...(profile.email && { email: profile.email }),
    ...(profile.firstName !== undefined && { firstName: profile.firstName }),
    ...(profile.lastName !== undefined && { lastName: profile.lastName }),
    ...(profile.phone !== undefined && { phone: profile.phone }),
    ...(profile.gender !== undefined && { gender: profile.gender }),
    ...(profile.dateOfBirth !== undefined && { dateOfBirth: profile.dateOfBirth }),
    ...(profile.avatarUrl !== undefined && { avatarUrl: profile.avatarUrl }),
  };

  const [row] = await db
    .insert(users)
    .values({ authUid: uid, email: profile.email ?? "", ...patch })
    .onConflictDoUpdate({
      target: users.authUid,
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
    .where(eq(users.authUid, uid))
    .limit(1);
  return row?.role ?? "user";
}
