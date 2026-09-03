import { db } from "../config/database.ts";
import { users } from "../models/schema.ts";
import { logger } from "../utils/logger.ts";

const inMemoryUsers = new Map<string, any>();

/** Upsert a user by Firebase UID. Falls back to an in-memory map when the DB is down. */
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const [row] = await db
      .insert(users)
      .values({ firebaseUid: uid, email })
      .onConflictDoUpdate({
        target: users.firebaseUid,
        set: { email, updatedAt: new Date() },
      })
      .returning();

    return row;
  } catch (error: any) {
    logger.warn("[user.service] DB unavailable for getOrCreateUser — in-memory fallback:", error?.message);
    const existing = inMemoryUsers.get(uid);
    if (existing) {
      existing.email = email;
      return existing;
    }
    const user = {
      id: `mem-${inMemoryUsers.size + 1}`,
      firebaseUid: uid,
      email,
      role: "user",
      createdAt: new Date(),
    };
    inMemoryUsers.set(uid, user);
    return user;
  }
}
