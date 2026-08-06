import { db } from './index.ts';
import { users } from './schema.ts';

const inMemoryUsers = new Map<string, any>();

export async function getOrCreateUser(uid: string, email: string) {
  try {
    // Use upsert to handle concurrent inserts of the same user ID safely
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn("[AI Studio] Database unavailable for getOrCreateUser, using in-memory fallback.");
    const existing = inMemoryUsers.get(uid);
    if (existing) {
      existing.email = email;
      return existing;
    }
    const user = { id: inMemoryUsers.size + 1, uid, email, createdAt: new Date() };
    inMemoryUsers.set(uid, user);
    return user;
  }
}

