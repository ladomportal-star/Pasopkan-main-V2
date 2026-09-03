import { db } from './index.ts';
import { users } from './schema.ts';

const inMemoryUsers = new Map<string, any>();

export async function getOrCreateUser(uid: string, email: string) {
  try {
    // Upsert on the Firebase UID so concurrent inserts are safe
    const result = await db
      .insert(users)
      .values({ firebaseUid: uid, email })
      .onConflictDoUpdate({
        target: users.firebaseUid,
        set: { email, updatedAt: new Date() },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn('[Backend DB] Database unavailable for getOrCreateUser, using in-memory fallback.');
    const existing = inMemoryUsers.get(uid);
    if (existing) {
      existing.email = email;
      return existing;
    }
    const user = {
      id: `mem-${inMemoryUsers.size + 1}`,
      firebaseUid: uid,
      email,
      role: 'user',
      createdAt: new Date(),
    };
    inMemoryUsers.set(uid, user);
    return user;
  }
}
