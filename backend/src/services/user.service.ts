import { db } from "../config/database.ts";
import { users } from "../models/schema.ts";
import { logger } from "../utils/logger.ts";

const inMemoryUsers = new Map<string, any>();

export interface ProfileInput {
  email: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
}

/** Upsert a user by Firebase UID. Falls back to an in-memory map when the DB is down. */
export async function getOrCreateUser(uid: string, email: string) {
  return upsertUserProfile(uid, { email });
}

/** Upsert the user row with whatever profile fields the client supplied.
 *  Only non-undefined fields are written, so a partial sync never wipes data. */
export async function upsertUserProfile(uid: string, profile: ProfileInput) {
  const patch = {
    email: profile.email,
    ...(profile.displayName !== undefined && { displayName: profile.displayName }),
    ...(profile.phone !== undefined && { phone: profile.phone }),
    ...(profile.avatarUrl !== undefined && { avatarUrl: profile.avatarUrl }),
  };

  try {
    const [row] = await db
      .insert(users)
      .values({ firebaseUid: uid, ...patch })
      .onConflictDoUpdate({
        target: users.firebaseUid,
        set: { ...patch, updatedAt: new Date() },
      })
      .returning();

    return row;
  } catch (error: any) {
    logger.warn("[user.service] DB unavailable — in-memory fallback:", error?.message);
    const existing = inMemoryUsers.get(uid) ?? {
      id: `mem-${inMemoryUsers.size + 1}`,
      firebaseUid: uid,
      role: "user",
      createdAt: new Date(),
    };
    Object.assign(existing, patch);
    inMemoryUsers.set(uid, existing);
    return existing;
  }
}
